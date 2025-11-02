import {
  fetchAdminProductDetails,
  updateProductAction,
  updateProductImageAction,
} from '@/utils/actions';
import FormContainer from '@/components/form/FormContainer';
import FormInput from '@/components/form/FormInput';
import PriceInput from '@/components/form/PriceInput';
import TextAreaInput from '@/components/form/TextAreaInput';
import { SubmitButton } from '@/components/form/Buttons';
import CheckboxInput from '@/components/form/CheckboxInput';
import NumberInput from '@/components/form/NumberInput';
import ImageInput from '@/components/form/ImageInput';
import Image from 'next/image';
import ImageInputContainer from '@/components/form/ImageInputContainer';

async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchAdminProductDetails(id);

  // 與 create 一致的欄位集合
  const {
    // 基本
    name,
    description,

    // 德文欄位
    bauteil_obergruppe,
    bauteil_gruner,
    zustand,
    material,
    ref_gebauede_geschoss,

    // 幾何尺寸
    breite,
    hoehe,
    tiefe,

    // 衍生數據
    flaeche,
    masse,
    anzahl,

    // 其他屬性
    price,
    co2,
    featured,
    image, // 目前已存在的圖（字串）
  } = product;

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-8 capitalize">update product</h1>

      <div className="border p-8 rounded-md">
        {/* Image Input Container */}
        <ImageInputContainer
          action={updateProductImageAction}
          name={name}
          image={product.image}
          text="update image"
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="url" value={product.image} />
        </ImageInputContainer>
        <FormContainer action={updateProductAction}>
          {/* 交由 action 辨識要更新哪一筆 */}
          <input type="hidden" name="id" value={id} />
          {/* 保留舊圖路徑（若使用者不重新上傳，可沿用） */}
          <input type="hidden" name="existingImage" value={image ?? ''} />

          <div className="grid gap-4 md:grid-cols-2">
            {/* 基本 */}
            <FormInput
              type="text"
              name="name"
              label="product name"
              defaultValue={name}
            />

            {/* 德文欄位 */}
            <FormInput
              type="text"
              name="bauteil_obergruppe"
              label="bauteil obergruppe"
              defaultValue={bauteil_obergruppe ?? ''}
            />
            <FormInput
              type="text"
              name="bauteil_gruner"
              label="bauteil gruner"
              defaultValue={bauteil_gruner ?? ''}
            />
            <FormInput
              type="text"
              name="zustand"
              label="zustand"
              defaultValue={zustand ?? ''}
            />
            <FormInput
              type="text"
              name="material"
              label="material"
              defaultValue={material ?? ''}
            />
            <FormInput
              type="text"
              name="ref_gebauede_geschoss"
              label="ref gebaude geschoss"
              defaultValue={ref_gebauede_geschoss ?? ''}
            />

            {/* 幾何尺寸 */}
            <NumberInput
              name="breite"
              label="breite (m)"
              defaultValue={breite ?? 0}
              step={0.01}
            />
            <NumberInput
              name="hoehe"
              label="hoehe (m)"
              defaultValue={hoehe ?? 0}
              step={0.01}
            />
            <NumberInput
              name="tiefe"
              label="tiefe (m)"
              defaultValue={tiefe ?? 0}
              step={0.01}
            />

            {/* 衍生數據 */}
            <NumberInput
              name="flaeche"
              label="flaeche (m²)"
              defaultValue={flaeche ?? 0}
              step={0.01}
            />
            <NumberInput
              name="masse"
              label="masse (kg)"
              defaultValue={masse ?? 0}
              step={0.01}
            />
            <NumberInput
              name="anzahl"
              label="anzahl"
              defaultValue={anzahl ?? 1}
              step={1}
            />

            {/* 其他屬性 */}
            <PriceInput defaultValue={price ?? 0} />
            <NumberInput
              name="co2"
              label="CO₂ (kg)"
              defaultValue={co2 ?? 0}
              step={0.01}
            />
            <CheckboxInput
              name="featured"
              label="featured"
              defaultChecked={!!featured}
            />

            {/* 敘述（整欄） */}
            <div className="md:col-span-2">
              <TextAreaInput
                name="description"
                labelText="description"
                defaultValue={description ?? ''}
              />
            </div>
          </div>

          <SubmitButton text="update product" className="mt-8" />
        </FormContainer>
      </div>
    </section>
  );
}

export default EditProductPage;
