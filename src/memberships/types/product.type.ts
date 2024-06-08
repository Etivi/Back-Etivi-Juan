export interface IProduct {
    id: number;
    name: string;
    slug: string;
    permalink: string;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    type: string;
    status: string;
    featured: boolean;
    catalog_visibility: string;
    description: string;
    short_description: string;
    sku: string;
    price: string;
    regular_price: string;
    sale_price: string;
    date_on_sale_from: null | string;
    date_on_sale_from_gmt: null | string;
    date_on_sale_to: null | string;
    date_on_sale_to_gmt: null | string;
    on_sale: boolean;
    purchasable: boolean;
    total_sales: string;
    virtual: boolean;
    downloadable: boolean;
    downloads: any[]; // You can replace `any` with a more specific type if you know the structure of downloads.
    download_limit: number;
    download_expiry: number;
    external_url: string;
    button_text: string;
    tax_status: string;
    tax_class: string;
    manage_stock: boolean;
    stock_quantity: null | number;
    backorders: string;
    backorders_allowed: boolean;
    backordered: boolean;
    low_stock_amount: null | number;
    sold_individually: boolean;
    weight: string;
    dimensions: {
      length: string;
      width: string;
      height: string;
    };
    shipping_required: boolean;
    shipping_taxable: boolean;
    shipping_class: string;
    shipping_class_id: number;
    reviews_allowed: boolean;
    average_rating: string;
    rating_count: number;
    upsell_ids: number[];
    cross_sell_ids: number[];
    parent_id: number;
    purchase_note: string;
    categories: any[]; // You can replace `any` with a more specific type if you know the structure of categories.
    tags: any[]; // You can replace `any` with a more specific type if you know the structure of tags.
    images: {
      id: number;
      date_created: string;
      date_created_gmt: string;
      date_modified: string;
      date_modified_gmt: string;
      src: string;
      name: string;
      alt: string;
    }[];
    attributes: {
      id: number;
      name: string;
      options: string[];
    }[];
    default_attributes: any[]; // You can replace `any` with a more specific type if you know the structure of default_attributes.
    variations: any[]; // You can replace `any` with a more specific type if you know the structure of variations.
    grouped_products: any[]; // You can replace `any` with a more specific type if you know the structure of grouped_products.
    menu_order: number;
    price_html: string;
    related_ids: number[];
    meta_data: {
      id: number;
      key: string;
      value: any; // You can replace `any` with a more specific type if you know the structure of meta_data values.
    }[];
    stock_status: string;
    has_options: boolean;
    yoast_head: null | string;
    yoast_head_json: null | string;
    _links: {
      self: {
        href: string;
      }[];
      collection: {
        href: string;
      }[];
      up: {
        href: string;
      }[];
    };
  }
  