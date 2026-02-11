import { FilterFormField, FormFieldType } from '@/components/dynamic-form';
import { TFunction } from 'i18next';

export const confluenceConstant = (t: TFunction) => [
  {
    label: 'Confluence Username',
    name: 'config.credentials.confluence_username',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: 'Confluence Access Token',
    name: 'config.credentials.confluence_access_token',
    type: FormFieldType.Password,
    required: false,
    tooltip:
      'Use Personal Access Token for newer Confluence versions. Leave empty if using password authentication.',
  },
  {
    label: 'Confluence Password',
    name: 'config.credentials.confluence_password',
    type: FormFieldType.Password,
    required: false,
    tooltip:
      "Use password for Confluence Server versions that don't support tokens (e.g., 6.13.21). Required if Access Token is not provided.",
    customValidate: (val: string, formValues: any) => {
      const accessToken =
        formValues?.config?.credentials?.confluence_access_token;
      const isCloud = formValues?.config?.is_cloud;
      // Password is required for non-cloud if no access token is provided
      if (!isCloud && !accessToken && !val) {
        return 'Either Access Token or Password is required for Confluence Server';
      }
      return true;
    },
    shouldRender: (formValues: any) => {
      // Show password field for non-cloud Confluence
      return !formValues?.config?.is_cloud;
    },
  },
  {
    label: 'Wiki Base URL',
    name: 'config.wiki_base',
    type: FormFieldType.Text,
    required: false,
    tooltip: t('setting.confluenceWikiBaseUrlTip'),
  },
  {
    label: 'Is Cloud',
    name: 'config.is_cloud',
    type: FormFieldType.Checkbox,
    required: false,
    tooltip: t('setting.confluenceIsCloudTip'),
  },
  {
    label: 'Index Mode',
    name: 'config.index_mode',
    type: FormFieldType.Segmented,
    options: [
      { label: 'Everything', value: 'everything' },
      { label: 'Space', value: 'space' },
      { label: 'Page', value: 'page' },
    ],
  },
  {
    name: 'config.page_id',
    label: 'Page ID',
    type: FormFieldType.Text,
    customValidate: (val: string, formValues: any) => {
      const index_mode = formValues?.config?.index_mode;
      console.log('index_mode', index_mode, val);
      if (!val && index_mode === 'page') {
        return 'Page ID is required';
      }
      return true;
    },
    shouldRender: (formValues: any) => {
      const index_mode = formValues?.config?.index_mode;
      return index_mode === 'page';
    },
  },
  {
    name: 'config.space',
    label: 'Space Key',
    type: FormFieldType.Text,
    customValidate: (val: string, formValues: any) => {
      const index_mode = formValues?.config?.index_mode;
      if (!val && index_mode === 'space') {
        return 'Space Key is required';
      }
      return true;
    },
    shouldRender: (formValues: any) => {
      const index_mode = formValues?.config?.index_mode;
      return index_mode === 'space';
    },
  },
  {
    name: 'config.index_recursively',
    label: 'Index Recursively',
    type: FormFieldType.Checkbox,
    shouldRender: (formValues: any) => {
      const index_mode = formValues?.config?.index_mode;
      return index_mode === 'page';
    },
  },
  {
    name: FilterFormField + '.tip',
    label: ' ',
    type: FormFieldType.Custom,
    shouldRender: (formValues: any) => {
      const index_mode = formValues?.config?.index_mode;
      return index_mode === 'everything';
    },
    render: () => (
      <div className="text-sm text-text-secondary bg-bg-card border border-border-button rounded-md px-3 py-2">
        {
          'This choice will index all pages the provided credentials have access to.'
        }
      </div>
    ),
  },
  {
    label: 'Space Key',
    name: 'config.space',
    type: FormFieldType.Text,
    required: false,
    hidden: true,
  },
  {
    label: 'Page ID',
    name: 'config.page_id',
    type: FormFieldType.Text,
    required: false,
    hidden: true,
  },
  {
    label: 'Index Recursively',
    name: 'config.index_recursively',
    type: FormFieldType.Checkbox,
    required: false,
    hidden: true,
  },
];
