import { Label } from '../ui/label';
import { Input } from '../ui/input';

type FormInputNumberProps = {
  name: string;
  label?: string;
  defaultValue?: number;
  step?: number;
};

const NumberInput = ({
  name,
  label,
  defaultValue,
  step,
}: FormInputNumberProps) => {
  return (
    <div className="mb-2">
      <Label htmlFor={name} className="capitalize">
        {label || name}
      </Label>
      <Input
        id={name}
        type="number"
        name={name}
        min={0}
        defaultValue={defaultValue || 100}
        step={step}
        required
      />
    </div>
  );
};

export default NumberInput;
