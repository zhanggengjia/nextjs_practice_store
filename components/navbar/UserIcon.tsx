import { LuUser } from 'react-icons/lu';
import { currentUser, auth } from '@clerk/nextjs/server';

async function UserIcon() {
  const user = await currentUser();
  const profileImage = user?.imageUrl;
  if (profileImage) {
    return (
      <img src={profileImage} className="!size-6 rounded-full object-cover" />
    );
  }
  return <LuUser className="!size-6 bg-primary rounded-full text-white" />;
}

export default UserIcon;
