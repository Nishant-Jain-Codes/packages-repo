import { BasketStep } from './types';
import React from 'react';
import CreateBasket from '@/features/content-management/basket/create/CreateBasket';
import ManageBasket from '@/features/content-management/basket/manage/ManageBasket';

export const BASKET_STEPS: BasketStep[] = [
  {
    id: 'manage-basket',
    title: 'Manage Baskets',
    subtitle: 'View and manage all baskets',
    component: ManageBasket,
  },
  {
    id: 'create-basket',
    title: 'Create/Edit Basket',
    subtitle: 'Create new basket or edit existing',
    component: CreateBasket,
  },
];
