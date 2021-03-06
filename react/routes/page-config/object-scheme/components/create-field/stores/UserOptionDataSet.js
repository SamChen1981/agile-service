import { findIndex } from 'lodash';

export default ({
  type, id, defaultUserId, isEdit,
}) => ({
  autoQuery: true,
  paging: false,
  transport: {
    read: ({ data: p, dataSet, params }) => ({
      // defaultUserId 初始值（初次进入编辑框未修改时）
      url: `/base/v1/${type}s/${id}/users?size=10${isEdit && p.userId === defaultUserId ? `&id=${defaultUserId}` : ''}`,
      method: 'get',
      transformResponse: (response) => {
        try {
          const data = JSON.parse(response);
          if (data && data.list) {
            const oldIndex = findIndex(dataSet.toData(), item => item.id === p.userId);
            const index = findIndex(data.list, item => item.id === p.userId);
            if (index === -1 && oldIndex !== -1) {
              data.list.unshift(dataSet.get(oldIndex).toData());
            }
            return data.list;
          } else {
            return data;
          }
        } catch (error) {
          return response;
        }
      },
    }),
  },
});
