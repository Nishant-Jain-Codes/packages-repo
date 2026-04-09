import { BucketStep } from './types';
import React from 'react';
import CreateBucket from '@/features/content-management/bucket/create/CreateBucket';
import ManageBucket from '@/features/content-management/bucket/manage/ManageBucket';

export const BUCKET_STEPS: BucketStep[] = [
  {
    id: 'manage-bucket',
    title: 'Manage Buckets',
    subtitle: 'View and manage all buckets',
    component: ManageBucket,
  },
  {
    id: 'create-bucket',
    title: 'Create/Edit Bucket',
    subtitle: 'Create new bucket or edit existing',
    component: CreateBucket,
  },
];
