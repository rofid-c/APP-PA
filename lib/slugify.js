// lib/slugify.js
// Dipakai di berbagai API route untuk bikin nama folder/slug URL yang aman.

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

module.exports = { slugify };
