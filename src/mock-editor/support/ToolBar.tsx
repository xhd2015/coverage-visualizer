import { Input, Select } from 'antd';
import { useState } from 'react';

export interface ToolBarProps {
  onToggleExpand?: (depth: number) => void;
  searchFile: (content: string) => void;
  extra?: any;
}

const MAX_NODE_DEPTH = 100;

export default function ToolBar(props: ToolBarProps) {
  const [val, setVal] = useState('');
  const [level, setLevel] = useState(MAX_NODE_DEPTH);

  return (
    <div
      className="list-bar code-box-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 8,
      }}
    >
      <Input
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
          const val = e.target.value;
          if (val) {
            props.searchFile(val);
          } else {
            props.searchFile(val);
            props.onToggleExpand(Number(MAX_NODE_DEPTH));
          }
        }}
        allowClear
        placeholder="搜索文件或目录"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (val) {
              props.searchFile(val);
            } else {
              props.searchFile(val);
              props.onToggleExpand(Number(MAX_NODE_DEPTH));
            }
          }
        }}
      />
      <div style={{ backgroundColor: '#ccc', marginLeft: 12 }}>
        <Select
          value={level}
          onChange={(v) => {
            setLevel(Number(v));
            props.onToggleExpand(Number(v));
          }}
          options={[
            {
              value: MAX_NODE_DEPTH,
              label: '全部展开',
            },
            {
              value: 1,
              label: '一级展开',
            },
            {
              value: 2,
              label: '二级展开',
            },
            {
              value: 3,
              label: '三级展开',
            },
          ]}
        />
      </div>
      {props.extra}
    </div>
  );
}
