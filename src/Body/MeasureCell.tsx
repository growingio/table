import * as React from 'react';
import ResizeObserver from 'rc-resize-observer';
import { debounce } from 'lodash';

export interface MeasureCellProps {
  columnKey: React.Key;
  onColumnResize: (key: React.Key, width: number) => void;
}

export default function MeasureCell({ columnKey, onColumnResize }: MeasureCellProps) {
  const cellRef = React.useRef<HTMLTableDataCellElement>();

  React.useEffect(() => {
    if (cellRef.current) {
      onColumnResize(columnKey, cellRef.current.offsetWidth);
    }
  }, []);

  return (
    <ResizeObserver
      onResize={debounce(({ offsetWidth }) => {
        onColumnResize(columnKey, offsetWidth);
      }, 100)}
    >
      <td ref={cellRef} style={{ padding: 0, border: 0, height: 0 }}>
        <div style={{ height: 0, overflow: 'hidden' }}>&nbsp;</div>
      </td>
    </ResizeObserver>
  );
}
