import React from 'react';

const Footer = () => {
  return (
    <footer className="absolute bottom-0 left-0 right-0 text-stone-300 text-center">
      <p>&copy; {new Date().getFullYear()} TK. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
