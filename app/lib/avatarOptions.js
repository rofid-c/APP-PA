// Konstanta avatar — dipakai di frontend (picker) dan backend (validasi)
const AVATAR_ICONS = [
  '🌸','🌻','🌼','🌺','🌷','🍀','🌿','🪴','🌵','🍁',
  '🍃','🍄','🌙','⭐','✨','❄️','🔥','💧','🎈',
  '🍎','🍉','🌊','⛰️','🌾','🍂','🌱','🧊','🪨','🔶',
  '🐢','🦋','🐝','🐬','🦊','🐨','🐼','🐙','🦉','🐌',
];

const AVATAR_COLORS = [
  '#FFD6E8', '#FFE8D6', '#FFF6D6', '#E8FFD6', '#D6FFE8', '#D6F6FF',
  '#D6E8FF', '#E8D6FF', '#FFD6F6', '#D6FFF0',
];

function randomAvatar() {
  return {
    icon: AVATAR_ICONS[Math.floor(Math.random() * AVATAR_ICONS.length)],
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  };
}

module.exports = { AVATAR_ICONS, AVATAR_COLORS, randomAvatar };
