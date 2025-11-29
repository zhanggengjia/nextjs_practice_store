'use server';
import db from '@/utils/db';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import {
  imageSchema,
  productSchema,
  reviewSchema,
  validateWithZodSchema,
} from './schemas';
import { deleteImage, uploadImage } from './supabase';
import { revalidatePath } from 'next/cache';
import { Prisma, Product, Cart } from '@prisma/client';

const renderError = (error: unknown): { message: string; success: boolean } => {
  console.log(error);
  return {
    success: false,
    message: error instanceof Error ? error.message : 'Unknown error',
  };
};

export const getAuthUser = async () => {
  const user = await currentUser();
  if (!user) {
    throw new Error('You must be logged in to access this route');
  }
  return user;
};

const getAdminUser = async () => {
  const user = await getAuthUser();
  if (user.id !== process.env.ADMIN_USER_ID) redirect('/');
  return user;
};

export const fetchAdminProducts = async () => {
  await getAdminUser();
  const products = await db.product.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
  return products;
};

type ProductWithFavoriteId = Product & { favoriteId: string | null };

export const fetchFeaturedProducts = async (): Promise<
  ProductWithFavoriteId[]
> => {
  // Clerk 的 auth() 在 App Router 是同步，不要 await
  const { userId } = await auth();
  const clerkId = userId ?? null;

  // ✔ featured 條件
  const where: Prisma.ProductWhereInput = {
    featured: true,
  };

  // ✔ 查詢 featured products
  const products = await db.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: clerkId
      ? {
          favorites: {
            where: { clerkId },
            select: { id: true },
          },
        }
      : undefined,
  });

  // ✔ 統一路徑：favoriteId
  type ProductWithMaybeFavorites = Product & {
    favorites?: { id: string }[];
  };

  const productsWithFavoriteId: ProductWithFavoriteId[] = (
    products as ProductWithMaybeFavorites[]
  ).map((p) => ({
    ...p,
    favoriteId: clerkId ? p.favorites?.[0]?.id ?? null : null,
  }));

  return productsWithFavoriteId;
};

export const fetchAllProducts = async ({ search = '' }: { search: string }) => {
  return db.product.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { material: { contains: search, mode: 'insensitive' } },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export async function fetchSingleProduct(id: string) {
  let userId: string | null = null;
  try {
    const user = await getAuthUser();
    userId = user.id;
  } catch {
    userId = null;
  }

  const product = await (userId
    ? db.product.findUnique({
        where: { id },
        include: {
          favorites: {
            where: { clerkId: userId },
            select: { id: true },
          },
        },
      })
    : db.product.findUnique({
        where: { id },
      }));

  if (!product) {
    throw new Error('Product not found');
  }

  const anyProduct = product as any;

  return {
    ...product,
    favoriteId: userId ? anyProduct.favorites?.[0]?.id ?? null : null,
  };
}

export const createProductAction = async (
  prevState: any,
  formData: FormData
): Promise<{ message: string }> => {
  const user = await getAuthUser();

  try {
    const rawData = Object.fromEntries(formData);
    const file = formData.get('image') as File;
    const validatedFields = validateWithZodSchema(productSchema, rawData);
    const validatedFile = validateWithZodSchema(imageSchema, { image: file });
    const fullPath = await uploadImage(validatedFile.image, user.id);

    await db.product.create({
      data: {
        ...validatedFields,
        image: fullPath,
        clerkId: user.id,
      },
    });
  } catch (error) {
    return renderError(error);
  }
  redirect('/admin/products');
};

export const deleteProductAction = async (
  prevState: { productId: string },
  _formData: FormData
) => {
  const { productId } = prevState;
  await getAdminUser();

  try {
    const product = await db.product.delete({
      where: {
        id: productId,
      },
    });

    await deleteImage(product.image);

    revalidatePath('/admin/products');
    return { message: 'product removed' };
  } catch (error) {
    return renderError(error);
  }
};

export const fetchAdminProductDetails = async (productId: string) => {
  await getAdminUser();
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  });
  if (!product) redirect('/admin/products');
  return product;
};

export const updateProductAction = async (
  prevState: any,
  formData: FormData
) => {
  await getAdminUser();
  try {
    const productId = formData.get('id') as string;
    const rawData = Object.fromEntries(formData);

    const validatedFields = validateWithZodSchema(productSchema, rawData);

    await db.product.update({
      where: {
        id: productId,
      },
      data: {
        ...validatedFields,
      },
    });
    revalidatePath(`/admin/products/${productId}/edit`);
    return { message: 'Product updated successfully' };
  } catch (error) {
    return renderError(error);
  }
};

export const updateProductImageAction = async (
  prevState: any,
  formData: FormData
) => {
  const user = await getAuthUser();
  try {
    const image = formData.get('image') as File;
    const productId = formData.get('id') as string;
    const oldImageUrl = formData.get('url') as string;

    const validatedFile = validateWithZodSchema(imageSchema, { image });
    const fullPath = await uploadImage(validatedFile.image, user.id);
    await deleteImage(oldImageUrl);
    await db.product.update({
      where: {
        id: productId,
      },
      data: {
        image: fullPath,
      },
    });
    revalidatePath(`/admin/products/${productId}/edit`);
    return { message: 'Product Image updated successfully' };
  } catch (error) {
    return renderError(error);
  }
};

export const fetchFavoriteId = async ({ productId }: { productId: string }) => {
  const user = await getAuthUser();
  const favorite = await db.favorite.findFirst({
    where: {
      productId,
      clerkId: user.id,
    },
    select: {
      id: true,
    },
  });
  return favorite?.id || null;
};

type FetchProductsPageArgs = {
  search?: string;
  page: number;
  pageSize?: number;
};

export async function fetchProductsPage({
  search = '',
  page,
  pageSize = 12,
}: FetchProductsPageArgs) {
  let userId: string | null = null;
  try {
    const user = await getAuthUser();
    userId = user.id;
  } catch {
    userId = null;
  }

  const where: Prisma.ProductWhereInput | undefined = search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive' as const, // 關鍵：保持 literal type
            },
          },
          {
            material: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }
    : {};

  const [products, totalProducts] = await Promise.all([
    userId
      ? db.product.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            favorites: {
              where: { clerkId: userId },
              select: { id: true },
            },
          },
        })
      : db.product.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
    db.product.count({ where }),
  ]);

  const productsWithFavoriteId = products.map((p: any) => ({
    ...p,
    favoriteId: userId ? p.favorites?.[0]?.id ?? null : null,
  }));

  return {
    products: productsWithFavoriteId,
    totalProducts,
    pageSize,
  };
}

type ToggleFavoriteArgs = {
  productId: string;
  pathname: string;
};

type ToggleResult = {
  message: string;
  favoriteId: string | null;
};

export async function toggleFavoriteAction({
  productId,
  pathname,
}: ToggleFavoriteArgs): Promise<ToggleResult> {
  const user = await getAuthUser();

  const existing = await db.favorite.findFirst({
    where: {
      productId,
      clerkId: user.id,
    },
  });

  let favoriteId: string | null;

  if (existing) {
    await db.favorite.delete({
      where: { id: existing.id },
    });
    favoriteId = null;
  } else {
    const created = await db.favorite.create({
      data: {
        productId,
        clerkId: user.id,
      },
    });
    favoriteId = created.id;
  }

  // 讓 /products 這類 server component 下次載入時資料是新的
  revalidatePath(pathname);

  return {
    message: existing ? 'Removed from favorites' : 'Added to favorites',
    favoriteId,
  };
}

type FavoriteWithProduct = Prisma.FavoriteGetPayload<{
  include: { product: true };
}>;

export const fetchUserFavorites = async (): Promise<FavoriteWithProduct[]> => {
  const { userId } = await auth();

  if (!userId) {
    // 這頁本來就應該只有登入才能看，可以丟錯或改成 redirect
    throw new Error('You must be logged in to view favorites');
  }

  const favorites = await db.favorite.findMany({
    where: {
      clerkId: userId,
    },
    include: {
      product: true,
    },
  });

  return favorites;
};

export const createReviewAction = async (
  prevState: any,
  formData: FormData
) => {
  const user = await getAuthUser();
  try {
    const rawData = Object.fromEntries(formData);
    const validatedFields = validateWithZodSchema(reviewSchema, rawData);

    await db.review.create({
      data: {
        ...validatedFields,
        clerkId: user.id,
      },
    });
    revalidatePath(`/products/${validatedFields.productId}`);
    return { message: 'Review submitted successfully' };
  } catch (error) {
    return renderError(error);
  }
};

export const fetchProductReviews = async (productId: string) => {
  const reviews = await db.review.findMany({
    where: {
      productId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return reviews;
};
export const fetchProductReviewsByUser = async () => {
  const user = await getAuthUser();
  const reviews = await db.review.findMany({
    where: {
      clerkId: user.id,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      product: {
        select: {
          image: true,
          name: true,
        },
      },
    },
  });
  return reviews;
};

export const deleteReviewAction = async (prevState: { reviewId: string }) => {
  const { reviewId } = prevState;
  const user = await getAuthUser();

  try {
    await db.review.delete({
      where: {
        id: reviewId,
        clerkId: user.id,
      },
    });

    revalidatePath('/reviews');
    return { message: 'Review deleted successfully' };
  } catch (error) {
    return renderError(error);
  }
};

export const findExistingReview = async (userId: string, productId: string) => {
  return db.review.findFirst({
    where: {
      clerkId: userId,
      productId,
    },
  });
};

export const fetchProductRating = async (productId: string) => {
  const result = await db.review.groupBy({
    by: ['productId'],
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
    where: {
      productId,
    },
  });

  return {
    rating: result[0]?._avg.rating?.toFixed(1) ?? 0,
    count: result[0]?._count.rating ?? 0,
  };
};

export const fetchCartItems = async () => {
  const { userId } = await auth();

  const cart = await db.cart.findFirst({
    where: {
      clerkId: userId ?? '',
    },
    select: {
      numItemsInCart: true,
    },
  });
  return cart?.numItemsInCart || 0;
};

const fetchProduct = async (productId: string) => {
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }
  return product;
};

const includeProductClause = {
  cartItems: {
    include: {
      product: true,
    },
  },
};

export const fetchOrCreateCart = async ({
  userId,
  errorOnFailure = false,
}: {
  userId: string;
  errorOnFailure?: boolean;
}) => {
  let cart = await db.cart.findFirst({
    where: {
      clerkId: userId,
    },
    include: includeProductClause,
  });

  if (!cart && errorOnFailure) {
    throw new Error('Cart not found');
  }

  if (!cart) {
    cart = await db.cart.create({
      data: {
        clerkId: userId,
      },
      include: includeProductClause,
    });
  }
  return cart;
};

const updateOrCreateCartItem = async ({
  productId,
  cartId,
  amount,
}: {
  productId: string;
  cartId: string;
  amount: number;
}) => {
  let cartItem = await db.cartItem.findFirst({
    where: {
      productId,
      cartId,
    },
  });

  if (cartItem) {
    cartItem = await db.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        amount: cartItem.amount + amount,
      },
    });
  } else {
    cartItem = await db.cartItem.create({
      data: { amount, productId, cartId },
    });
  }
};

export const updateCart = async (cart: Cart) => {
  const cartItems = await db.cartItem.findMany({
    where: {
      cartId: cart.id,
    },
    include: {
      product: true,
    },
  });

  let numItemsInCart = 0;
  let cartTotal = 0;

  for (const item of cartItems) {
    numItemsInCart += item.amount;
    cartTotal += item.amount * item.product.price;
  }

  const tax = cart.taxRate * cartTotal;
  const shipping = cartTotal ? cart.shipping : 0;
  const orderTotal = cartTotal + tax + shipping;

  await db.cart.update({
    where: {
      id: cart.id,
    },
    data: {
      numItemsInCart,
      cartTotal,
      tax,
      orderTotal,
    },
  });
};

export const addToCartAction = async (prevState: any, formData: FormData) => {
  const user = await getAuthUser();
  try {
    const productId = formData.get('productId') as string;
    const amount = Number(formData.get('amount'));
    await fetchProduct(productId);
    const cart = await fetchOrCreateCart({ userId: user.id });
    await updateOrCreateCartItem({ productId, cartId: cart.id, amount });
    await updateCart(cart);
    revalidatePath(`/products/${productId}`);
    return { message: 'Products added to cart' };
  } catch (error) {
    return renderError(error);
  }
};

export const removeCartItemAction = async () => {};

export const updateCartItemAction = async () => {};
