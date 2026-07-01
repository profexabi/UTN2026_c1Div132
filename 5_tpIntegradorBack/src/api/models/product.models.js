/*================================
    Modelos de producto
================================*/

import sequelize from "../database/sequelize.js";
import { DataTypes } from "sequelize";

const Producto = sequelize.define("Product", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
    // validate: {
    //     isAlphanumeric : false
    // }
  },

  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  category: {
    type: DataTypes.ENUM(["food", "drink"]),
    allowNull: false,
  },

  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
});

/////////////////////////////////
// Traer todos los productos
const selectAllProducts = async () => {
  // Optimizacion 3: Sacamos * para evitar traer columnas innecesarias -> Mas eficiente en memoria y peticion de red. Ademas separamos la sentencia en una variable
  // const sql = "SELECT id, name, price, image FROM products";
  // return connection.query(sql);
  const rows = await Producto.findAll({
    attributes: ["id", "name", "price", "image"],
  });
  return [rows, null];
};

/////////////////////////////////
// Traer producto por id
const selectProductById = async (id) => {
  // Optimizacion 4: Guardamos la consulta sql en una variable y la optimizamos pidiendo solo los campos requereidos
  const product = await Producto.findByPk(id);
  return [product ? [product] : []];
};

/////////////////////////////////
// Crear producto
const insertNewProduct = async (name, image, category, price) => {
    const createdProduct = await Producto.create({name, image, category, price})
    return [ { insertId : createdProduct.id } ]
};

/////////////////////////////////
// Modificar producto
const updateProduct = async (name, image, price, category, id) => {
    const [ affectedRows ] = await Producto.update(
        {name, image, price, category },  
        {
            where :  { id }
        }
    )

    return [ { affectedRows } ];

};

/////////////////////////////////
// Eliminar producto
const deleteProduct = async (id) => {
 const deleteProduct = await Producto.destroy({
    where: { id }
  })

  console.log(deleteProduct);
};

export default {
  selectAllProducts,
  selectProductById,
  insertNewProduct,
  updateProduct,
  deleteProduct,
};
