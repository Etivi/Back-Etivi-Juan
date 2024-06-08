  
export interface MembershipPlan {
    id: number;
    name: string;
    slug: string;
    status: string;
    access_method: string;
    has_subscription: boolean;
    has_subscription_installment: boolean;
    access_product_ids: number[];
    access_length_type: string;
    subscription_access_length_type: string;
    access_length: null;
    subscription_access_length: null;
    access_start_date: null;
    access_start_date_gmt: null;
    access_end_date: null;
    access_end_date_gmt: null;
    subscription_access_start_date: null;
    subscription_access_start_date_gmt: null;
    subscription_access_end_date: null;
    subscription_access_end_date_gmt: null;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    meta_data: any[];
    _links: any;
  }
  