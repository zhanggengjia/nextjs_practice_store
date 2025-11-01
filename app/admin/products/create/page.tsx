import FormInput from '@/components/form/FormInput';
import SubmitButton from '@/components/form/Buttons';
import FormContainer from '@/components/form/FormContainer';
import { createProductAction } from '@/utils/actions';
import ImageInput from '@/components/form/ImageInput';
import PriceInput from '@/components/form/PriceInput';
import TextAreaInput from '@/components/form/TextAreaInput';
import { faker } from '@faker-js/faker';
import CheckboxInput from '@/components/form/CheckboxInputhaha';
import NumberInput from '@/components/form/NumberInput';

function CreateProductPage() {
  // 基本
  const name = faker.commerce.productName();
  const description = faker.lorem.paragraphs({ min: 3, max: 5 });

  // 德文欄位
  const bauteil_obergruppe = faker.commerce.department(); // 部件大分類
  const bauteil_gruner = faker.commerce.product(); // 部件名稱
  const zustand = faker.helpers.arrayElement([
    'neu',
    'gebraucht',
    'beschädigt',
    'renoviert',
  ]);

  const material = faker.helpers.arrayElement([
    'Aluminium',
    'Glas',
    'Stahl',
    'Beton',
    'Holz',
  ]);

  const ref_gebauede_geschoss = faker.helpers.arrayElement([
    'EG',
    'OG1',
    'OG2',
    'OG3',
    'Dachgeschoss',
  ]);

  // 幾何尺寸
  const breite = faker.number.float({ min: 0.2, max: 5, fractionDigits: 2 });
  const hoehe = faker.number.float({ min: 0.2, max: 5, fractionDigits: 2 });
  const tiefe = faker.number.float({ min: 0.05, max: 1, fractionDigits: 2 });

  // 衍生數據
  const flaeche = parseFloat((breite * hoehe).toFixed(2));
  const masse = parseFloat(
    (
      flaeche * faker.number.float({ min: 10, max: 50, fractionDigits: 2 })
    ).toFixed(2)
  );
  const anzahl = faker.number.int({ min: 1, max: 10 });

  // 其他屬性
  const image = `/images/product-${faker.number.int({ min: 1, max: 10 })}.jpg`;
  const featured = faker.datatype.boolean();
  const price = faker.number.int({ min: 100, max: 5000 });
  const co2 = parseFloat(
    (
      flaeche * faker.number.float({ min: 2, max: 5, fractionDigits: 2 })
    ).toFixed(2)
  );

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-8 capitalize">create product</h1>
      <div className="border p-8 rounded-md">
        <FormContainer action={createProductAction}>
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
              defaultValue={bauteil_obergruppe}
            />
            <FormInput
              type="text"
              name="bauteil_gruner"
              label="bauteil gruner"
              defaultValue={bauteil_gruner}
            />
            <FormInput
              type="text"
              name="zustand"
              label="zustand"
              defaultValue={zustand}
            />
            <FormInput
              type="text"
              name="material"
              label="material"
              defaultValue={material}
            />
            <FormInput
              type="text"
              name="ref_gebauede_geschoss"
              label="ref gebaude geschoss"
              defaultValue={ref_gebauede_geschoss}
            />

            {/* 幾何尺寸 */}
            <NumberInput
              name="breite"
              label="breite (m)"
              defaultValue={breite}
              step={0.01}
            />
            <NumberInput
              name="hoehe"
              label="hoehe (m)"
              defaultValue={hoehe}
              step={0.01}
            />
            <NumberInput
              name="tiefe"
              label="tiefe (m)"
              defaultValue={tiefe}
              step={0.01}
            />

            {/* 衍生數據 */}
            <NumberInput
              name="flaeche"
              label="flaeche (m²)"
              defaultValue={flaeche}
              step={0.01}
            />
            <NumberInput
              name="masse"
              label="masse (kg)"
              defaultValue={masse}
              step={0.01}
            />
            <NumberInput
              name="anzahl"
              label="anzahl"
              defaultValue={anzahl}
              step={1}
            />

            {/* 其他屬性 */}
            <PriceInput defaultValue={price} />
            <NumberInput
              name="co2"
              label="CO₂ (kg)"
              defaultValue={co2}
              step={0.01}
            />
            <CheckboxInput
              name="featured"
              label="featured"
              defaultChecked={featured}
            />

            {/* 敘述（整欄）*/}
            <div className="md:col-span-2">
              <TextAreaInput
                name="description"
                labelText="description"
                defaultValue={description}
              />
            </div>
          </div>

          <div className="mt-8">
            <SubmitButton text="create product" className="btn btn-primary" />
          </div>
        </FormContainer>
      </div>
    </section>
  );
}

export default CreateProductPage;
