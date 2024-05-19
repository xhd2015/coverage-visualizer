import { Input, Select } from 'antd';
import { useState } from 'react';
import { useLanguages } from '../../lang/context';
import { searchFileOrDirPlaceholder, toolBarExpand1, toolBarExpand2, toolBarExpand3, toolBarExpandAll } from '../../lang/lang-texts';

export interface ToolBarProps {
  onToggleExpand?: (depth: number) => void;
  searchFile?: (content: string) => void;
  extra?: any;
}

const MAX_NODE_DEPTH = 100;

export default function ToolBar(props: ToolBarProps) {
  const languages = useLanguages()
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
        placeholder={searchFileOrDirPlaceholder.getText(languages)}
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
          dropdownMatchSelectWidth={false}
          options={[
            {
              value: MAX_NODE_DEPTH,
              label: toolBarExpandAll.getText(languages),
            },
            {
              value: 1,
              label: toolBarExpand1.getText(languages),
            },
            {
              value: 2,
              label: toolBarExpand2.getText(languages),
            },
            {
              value: 3,
              label: toolBarExpand3.getText(languages),
            },
          ]}
        />
      </div>
      {props.extra}
    </div>
  );
}
