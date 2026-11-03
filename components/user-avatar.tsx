import { initials } from '@/lib/chat';

type Props = {
  name: string | null;
  image?: string | null;
  size?: number;
};

export function UserAvatar({ name, image, size = 40 }: Props) {
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (image) {
    return (
      <img
        src={image}
        alt={name ?? 'User'}
        style={style}
        className="rounded-full object-cover bg-primary-light flex-shrink-0"
      />
    );
  }

  return (
    <div
      style={style}
      className="rounded-full bg-primary text-white font-bold flex items-center justify-center flex-shrink-0"
    >
      {initials(name)}
    </div>
  );
}