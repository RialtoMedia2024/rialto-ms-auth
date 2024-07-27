// const mongoose = require("mongoose");

// const itemSchema = new mongoose.Schema({
//   supplierId: {
//     type: String,
//     trim: true,
//     required: true,
//   },
//   supplierName: {
//     type: String,
//     trim: true,
//     required: true,
//   },

//   tags:[],
  
//   isDeleted: {
//     type: Boolean,
//     default: false
//   }
// });

// const favouriteSchema = new mongoose.Schema(
//   {
//     userId: {
//       // this is emailId of user
//       type: Number,
//       trim: true,
//       required: true,
//       unique: true,
//     },
//     items: [itemSchema],
//   },
//   { timestamps: true }
// );

// favouriteSchema.methods = {
//   addItem: function (nItem) {
//     const indexFound = this.items.findIndex(
//       (item) => item.supplierName == nItem.supplierName
//     );

//     if (indexFound === -1) {
//       this.items.push(nItem);
//     } else {
//       this.items[indexFound].isDeleted = false;
//     }
//   },

//   deleteItem: function (nItem) {
//     const indexFound = this.items.findIndex(
//       (item) => item.supplierName == nItem.supplierName
//     );

//     if (indexFound !== -1) {
//       this.items[indexFound].isDeleted = true;
//     }
//   },

//   emptyItem: function () {
//     this.items = [];
//   },
// };

// module.exports = Favourite = mongoose.model("Favourite", favouriteSchema);
