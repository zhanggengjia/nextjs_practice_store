import { Card, CardContent, CardHeader } from '../ui/card';
import Rating from './Rating';
import Comment from './Comment';
import Image from 'next/image';
import { toImageSrc } from '@/lib/image-url';

type ReviewCardProps = {
  reviewInfo: {
    comment: string;
    rating: number;
    name: string;
    image: string;
  };
  children?: React.ReactNode;
};

function ReviewCard({ reviewInfo, children }: ReviewCardProps) {
  const src = toImageSrc(reviewInfo.image);
  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center">
          <Image
            src={src}
            alt={reviewInfo.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="ml-4">
            <h3 className="text-sm font-bold capitalize mb-1">
              {reviewInfo.name}
            </h3>
            <Rating rating={reviewInfo.rating} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Comment comment={reviewInfo.comment} />
      </CardContent>
      <div className="absolute top-3 right-3">{children}</div>
    </Card>
  );
}

export default ReviewCard;
