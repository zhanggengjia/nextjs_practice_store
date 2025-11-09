'use client';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { toast } from 'sonner';

const ImageInput = () => {
  const name = 'image';
  const MAX_SIZE = 1024 * 1024; // 1MB
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      toast.error('File size must be less than 1 MB');
      e.target.value = ''; // 清掉檔案，防止送出
    }
  };

  return (
    <div className="mb-2">
      <Label htmlFor={name} className="capitalize">
        Image
      </Label>
      <Input
        id={name}
        name={name}
        type="file"
        required
        accept="image/*"
        onChange={handleChange}
      />
    </div>
  );
};

export default ImageInput;
