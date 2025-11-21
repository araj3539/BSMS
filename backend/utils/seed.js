require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Promotion = require('../models/Promotion');
// const bcrypt = require('bcrypt');

async function run(){
 await mongoose.connect(process.env.MONGO_URI);
  console.log('connected');

  // create admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bookshop.local';
  const adminPass = process.env.ADMIN_PASS || 'Admin@123';
  await User.deleteMany({});
  
  // Just pass the plain password. The pre('save') hook in User.js will handle hashing.
  await new User({ name:'Admin', email: adminEmail, password: adminPass, role:'admin' }).save(); 
  
  console.log('admin created', adminEmail, adminPass);

  await Book.deleteMany({});
  const books = [
    { title:'Clean Code', author:'Robert C. Martin', price:499, stock:10, category:'Programming', isbn:'9780132350884', description:'A Handbook of Agile Software Craftsmanship', coverImageUrl:'' },
    { title:'Introduction to Algorithms', author:'Cormen et al', price:799, stock:5, category:'Algorithms', isbn:'0262033844', description:'CLRS', coverImageUrl:'' },
    { title:'You Don\'t Know JS', author:'Kyle Simpson', price:299, stock:20, category:'Programming', isbn:'978-1-59327-950-9', description:'JS deep dive', coverImageUrl:'' },
    { title:'The Pragmatic Programmer', author:'Andrew Hunt', price:399, stock:8, category:'Programming', isbn:'978-0201616224', description:'Classic dev book', coverImageUrl:'' }
  ];
  await Book.insertMany(books);
  console.log('books seeded');

  await Promotion.deleteMany({});
  await new Promotion({ name:'New Year 10% OFF', code:'NY10', type:'percent', value:10, active:true }).save();
  await new Promotion({ name:'Flat 100 OFF', code:'FLAT100', type:'flat', value:100, active:true, minOrderValue:500 }).save();
  console.log('promotions seeded');

  console.log('seed done');
  process.exit(0);
}
run().catch(err=>{ console.error(err); process.exit(1); });
