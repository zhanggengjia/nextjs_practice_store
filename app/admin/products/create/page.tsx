import FormInput from '@/components/form/FormInput';
import SubmitButton from '@/components/form/Buttons';
import FormContainer from '@/components/form/FormContainer';
import { createProductAction } from '@/utils/actions';
import ImageInput from '@/components/form/ImageInput';
import PriceInput from '@/components/form/PriceInput';
import TextAreaInput from '@/components/form/TextAreaInput';
import { faker } from '@faker-js/faker';
import CheckBoxInput from '@/components/form/CheckBoxInput';

function CreateProductPage() {
  const name = faker.commerce.productName();
  const company = faker.company.name();
  const description = faker.lorem.paragraph({ min: 10, max: 12 });

  // const bauteilObjergruppe =

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-8 capitalize">create product</h1>
    </section>
  );
}

export default CreateProductPage;
