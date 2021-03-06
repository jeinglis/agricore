import dbConnection, { tableNames, execute } from '../connection';

const productTypesTable = () => dbConnection()(tableNames.PRODUCT_TYPES);
const productTypesAttributesTable = () => dbConnection()(tableNames.PRODUCT_ATTRIBUTE_TYPES);

interface ProductTypeDb {
  producttypeid: number;
  productname: string;
  productunits: string;
}

interface ProductAttributeDb {
  producttypeid: number;
  attrid: number;
  attrname: string;
}

interface ProductType {
  name: string;
  unit: string;
  attributes: ProductAttribute[];
}

/**
 * Type for a product attribute
 */
type ProductAttribute = string;


/**
 * Query builder
 */
const builders = {
  /**
   * Gets all product types
   */
  getProductTypes() {
    return productTypesTable().select('*');
  },
  /**
   * Gets all attributes for all product types
   */
  getProductAttributes() {
    return productTypesAttributesTable().select('*');
  },
};

function formatProductTypes(types: ProductTypeDb[], attributes: ProductAttributeDb[]): ProductType[] {
  return types.map((type) => {
    const relatedAttributes = attributes
      .filter((attribute) => {
        return type.producttypeid === attribute.producttypeid;
      })
      .map((attribute) => {
        return attribute.attrname;
      });

    return {
      name: type.productname,
      unit: type.productunits,
      attributes: relatedAttributes,
    };
  });
}

/**
 * Gets the product types and each of it's attributes from the database and formats it.
 */
export async function getProductTypes() {
  const types = await execute<ProductTypeDb[]>(builders.getProductTypes());
  const attributes = await execute<ProductAttributeDb[]>(builders.getProductAttributes());
  const response = formatProductTypes(types, attributes);
  
  return response;
}
