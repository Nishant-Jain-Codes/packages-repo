import { BlockStep } from './types';
import React from 'react';
import CreateBlock from '@/features/content-management/block/create/CreateBlock';
import ManageHomeScreen from '@/features/content-management/homescreen/manage/ManageHomeScreen';

export const BLOCK_STEPS: BlockStep[] = [
  {
    id: 'manage-blocks',
    title: 'Manage Blocks',
    subtitle: 'View and manage homepage blocks',
    component: ManageHomeScreen,
  },
  {
    id: 'create-block',
    title: 'Create/Edit Block',
    subtitle: 'Create new block or edit existing',
    component: CreateBlock,
  },
];
