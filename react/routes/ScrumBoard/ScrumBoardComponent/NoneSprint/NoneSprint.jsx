/* eslint-disable react/self-closing-comp,jsx-a11y/accessible-emoji */
import React from 'react';
import EmptyScrumboard from '@/assets/image/emptyScrumboard.svg';

const NoneSprint = ({ doingSprintExist }) => (
  <React.Fragment>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '80px',
      }}
    >
      <img style={{ width: 170 }} src={EmptyScrumboard} alt="emptyscrumboard" />
      <div
        style={{
          marginLeft: 40,
        }}
      >
        <p style={{ color: 'rgba(0,0,0,0.65)', fontSize: '13px' }}>{`${!doingSprintExist ? '没有活跃的Sprint' : '当前冲刺下未规划问题'}`}</p>
        <p style={{ fontSize: 16, lineHeight: '34px' }}>
          在工作列表的
          <span style={{ color: '#3f51b5' }}>待办事项</span>
          {!doingSprintExist ? '中开启冲刺' : '规划问题到当前冲刺'}
        </p>
      </div>
    </div>
  </React.Fragment>
);

export default NoneSprint;
