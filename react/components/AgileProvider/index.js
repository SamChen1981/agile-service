import React, {
  useContext, useRef, useEffect, useState,
} from 'react';
import { stores } from '@choerodon/boot';
import { IssueTypeContext } from '@/hooks/useIssueTypes';
import { DefaultPriorityContext } from '@/hooks/useDefaultPriority';
import { PriorityContext } from '@/hooks/usePriorities';

const { AppState } = stores;
function wrapWithContexts(contexts, values, children) {
  return contexts.reduce((last, Context, index) => (
    <Context.Provider value={values.get(index)}>
      {last}
    </Context.Provider>
  ), children);
}
const AgileProvider = contexts => function AgileDataProvider({ children, projectId }) {
  const dataRef = useRef(new Map());
  contexts.forEach((context, index) => {
    const { data: initData, refresh } = useContext(context);
    const [data, setData] = useState(initData);

    const loadData = async (...args) => {
      if (AppState.currentMenuType.type === 'project') {
        const res = await refresh(...args);
        dataRef.current.set(index, { data: res, refresh: loadData });
        setData(res);
      }
    };
    dataRef.current.set(context, { data, refresh: loadData });
    useEffect(() => {
      loadData();
    }, [projectId]);
  });
  return wrapWithContexts(contexts, dataRef.current, children);
};


export default AgileProvider([
  IssueTypeContext,
  DefaultPriorityContext,
  PriorityContext,
]);
