import { z, ZodObject, ZodType } from 'zod';

export const productSchema = z.object({
  // 基本欄位
  name: z
    .string()
    .min(2, { message: 'name must be at least 2 characters.' })
    .max(100, { message: 'name must be less than 100 characters.' }),

  // 德文欄位
  bauteil_obergruppe: z
    .string()
    .min(2, { message: 'bauteil_obergruppe must be at least 2 characters.' }),
  bauteil_gruner: z
    .string()
    .min(2, { message: 'bauteil_gruner must be at least 2 characters.' }),
  zustand: z
    .string()
    .min(2, { message: 'zustand must be at least 2 characters.' }),
  material: z
    .string()
    .min(2, { message: 'material must be at least 2 characters.' }),
  ref_gebauede_geschoss: z
    .string()
    .min(1, { message: 'ref_gebauede_geschoss is required.' }),

  // 幾何尺寸與數值欄位
  breite: z.coerce.number().min(0, { message: 'breite must be positive.' }),
  hoehe: z.coerce.number().min(0, { message: 'hoehe must be positive.' }),
  tiefe: z.coerce.number().min(0, { message: 'tiefe must be positive.' }),
  flaeche: z.coerce.number().min(0, { message: 'flaeche must be positive.' }),
  masse: z.coerce.number().min(0, { message: 'masse must be positive.' }),
  anzahl: z.coerce
    .number()
    .int({ message: 'anzahl must be an integer.' })
    .min(1, { message: 'anzahl must be at least 1.' }),

  // 其他屬性
  price: z.coerce
    .number()
    .int({ message: 'price must be an integer.' })
    .min(0, { message: 'price must be a positive number.' }),
  co2: z.coerce.number().min(0, { message: 'CO₂ must be positive.' }),
  featured: z.coerce.boolean(),

  // 敘述文字
  description: z.string().refine(
    (description) => {
      const wordCount = description.trim().split(/\s+/).length;
      return wordCount >= 10 && wordCount <= 1000;
    },
    {
      message: 'description must be between 10 and 1000 words.',
    }
  ),
});

export const imageSchema = z.object({
  image: validateImageFile(),
});

function validateImageFile() {
  const maxUploadSize = 1024 * 1024;
  const acceptedFileTypes = ['image/'];
  return z
    .instanceof(File)
    .refine((file) => {
      return !file || file.size <= maxUploadSize;
    }, `File size must be less than 1 MB`)
    .refine((file) => {
      return (
        !file || acceptedFileTypes.some((type) => file.type.startsWith(type))
      );
    }, 'File must be an image');
}

export function validateWithZodSchema<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((error) => error.message);
    throw new Error(errors.join('\n'));
  }

  return result.data;
}
