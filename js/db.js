const DB = (() => {
  const K = { p: 'nabd_products', o: 'nabd_orders', c: 'nabd_cart' };
  
  const seed = [
    { id: 1, name: "سماعة لاسلكية برو", cat: "سماعات", price: 449, old: 599, stock: 12, rating: 4.7, icon: "images/head.webp", desc: "وبطارية تدوم 30 ساعة" },
    { id: 2, name: "سماعات أذن صغيرة", cat: "سماعات", price: 179, old: 0, stock: 30, rating: 4.3, icon: "images/51jV63T4bNL.jpg", desc: "علبة شحن مدمجة" },
    { id: 3, name: "مكبر صوت محمول", cat: "مكبرات", price: 299, old: 349, stock: 8, rating: 4.6, icon: "images/SBGORBLK82-A.jpg", desc: "مقاوم للغبار والماء" },
    { id: 4, name: "مكبر صوت مكتبي", cat: "مكبرات", price: 529, old: 0, stock: 0, rating: 4.8, icon: "images/71X+yvdJZJL.jpg", desc: "تصميم مميز وقوي" },
    { id: 5, name: "سوار رياضي", cat: "ساعات", price: 529, old: 0, stock: 0, rating: 4.1, icon: "images/shopping.webp", desc: "نظام GPS متطور" },
    { id: 6, name: "ساعة يد ذكية", cat: "ساعات", price: 899, old: 0, stock: 15, rating: 4.5, icon: "images/images (1).jfif", desc: "شاشة AMOLED واضحة" },
    { id: 7, name: "شاحن سريع 65 واط", cat: "إكسسوارات", price: 149, old: 0, stock: 40, rating: 4.1, icon: "images/shopping (1).webp", desc: "منفذين USB-C" },
    { id: 8, name: "ميكروفون استوديو", cat: "إكسسوارات", price: 89, old: 119, stock: 60, rating: 4.4, icon: "images/shopping (2).webp", desc: "لتسجيل الصوت النقي" }
  ];

  const get = (k) => {
    try {
      return JSON.parse(localStorage.getItem(k)) || [];
    } catch (e) {
      return [];
    }
  };

  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

if (!localStorage.getItem(K.p) || !localStorage.getItem(K.p).length) {
    set(K.p, seed);
  }

  return {
    products: () => {
      const data = get(K.p);
      return data && data.length ? data : seed;
    },
    saveProducts: (v) => set(K.p, v),
    orders: () => get(K.o),
    saveOrders: (v) => set(K.o, v),
    cart: () => get(K.c),
    saveCart: (v) => set(K.c, v),
    reset: () => { 
      set(K.p, seed); 
      set(K.o, []); 
      set(K.c, []); 
    }
  };
})();