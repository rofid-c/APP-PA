'use client';

export default function Avatar({ user, size = 36 }) {
  if (!user) return null;

  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (user.avatarType === 'photo' && user.avatarPhotoPath) {
    return (
      <div style={style}>
        <img
          src={`/api/profile/avatar-photo/${user.id}`}
          alt="Foto profil"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div style={{ ...style, background: user.avatarColor || '#E8D6FF', fontSize: size * 0.55 }}>
      {user.avatarIcon || '🌸'}
    </div>
  );
}
