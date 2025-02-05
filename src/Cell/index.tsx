import * as React from 'react';
import classNames from 'classnames';
import { supportRef } from 'rc-util/lib/ref';
import type {
  DataIndex,
  ColumnType,
  RenderedCell,
  CustomizeComponent,
  CellType,
  DefaultRecordType,
  AlignType,
  CellEllipsisType,
} from '../interface';
import { getPathValue, validateValue } from '../utils/valueUtil';
import StickyContext from '../context/StickyContext';

function isRenderCell<RecordType>(
  data: React.ReactNode | RenderedCell<RecordType>,
): data is RenderedCell<RecordType> {
  return data && typeof data === 'object' && !Array.isArray(data) && !React.isValidElement(data);
}

function isRefComponent(component: CustomizeComponent) {
  // String tag component also support ref
  if (typeof component === 'string') {
    return true;
  }
  return supportRef(component);
}

export interface CellProps<RecordType extends DefaultRecordType> {
  prefixCls?: string;
  className?: string;
  record?: RecordType;
  /** `record` index. Not `column` index. */
  index?: number;
  dataIndex?: DataIndex;
  render?: ColumnType<RecordType>['render'];
  component?: CustomizeComponent;
  children?: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  ellipsis?: CellEllipsisType;
  align?: AlignType;

  shouldCellUpdate?: (record: RecordType, prevRecord: RecordType) => boolean;

  // Fixed
  fixLeft?: number | false;
  fixRight?: number | false;
  firstFixLeft?: boolean;
  lastFixLeft?: boolean;
  firstFixRight?: boolean;
  lastFixRight?: boolean;

  // Additional
  /** @private Used for `expandable` with nest tree */
  appendNode?: React.ReactNode;
  additionalProps?: React.HTMLAttributes<HTMLElement>;
  /** @private Fixed for user use `shouldCellUpdate` which block the render */
  expanded?: boolean;

  rowType?: 'header' | 'body' | 'footer';

  isSticky?: boolean;
  columnKey?: React.Key;
  columnIndex?: number;
}

function Cell<RecordType extends DefaultRecordType>(
  {
    prefixCls,
    className,
    record,
    index,
    dataIndex,
    render,
    children,
    component: Component = 'td',
    colSpan,
    rowSpan,
    fixLeft,
    fixRight,
    firstFixLeft,
    lastFixLeft,
    firstFixRight,
    lastFixRight,
    appendNode,
    additionalProps = {},
    ellipsis,
    align,
    rowType,
    isSticky,
    columnIndex,
    columnKey,
  }: CellProps<RecordType>,
  ref: React.Ref<any>,
): React.ReactElement {
  const cellPrefixCls = `${prefixCls}-cell`;

  const supportSticky = React.useContext(StickyContext);

  // ==================== Child Node ====================
  let cellProps: CellType<RecordType>;
  let childNode: React.ReactNode;

  if (validateValue(children)) {
    childNode = children;
  } else {
    const value = getPathValue<object | React.ReactNode, RecordType>(record, dataIndex);

    // Customize render node
    childNode = value;
    if (render) {
      const renderData = render(value, record, index);

      if (isRenderCell(renderData)) {
        childNode = renderData.children;
        cellProps = renderData.props;
      } else {
        childNode = renderData;
      }
    }
  }

  // Not crash if final `childNode` is not validate ReactNode
  if (
    typeof childNode === 'object' &&
    !Array.isArray(childNode) &&
    !React.isValidElement(childNode)
  ) {
    childNode = null;
  }

  if (ellipsis && (lastFixLeft || firstFixRight)) {
    childNode = <span className={`${cellPrefixCls}-content`}>{childNode}</span>;
  }

  const {
    colSpan: cellColSpan,
    rowSpan: cellRowSpan,
    style: cellStyle,
    className: cellClassName,
    ...restCellProps
  } = cellProps || {};
  const mergedColSpan = cellColSpan !== undefined ? cellColSpan : colSpan;
  const mergedRowSpan = cellRowSpan !== undefined ? cellRowSpan : rowSpan;

  if (mergedColSpan === 0 || mergedRowSpan === 0) {
    return null;
  }

  // ====================== Fixed =======================
  const fixedStyle: React.CSSProperties = {};
  const isFixLeft = typeof fixLeft === 'number' && supportSticky;
  const isFixRight = typeof fixRight === 'number' && supportSticky;

  if (isFixLeft) {
    fixedStyle.position = 'sticky';
    fixedStyle.left = fixLeft as number;
  }
  if (isFixRight) {
    fixedStyle.position = 'sticky';

    fixedStyle.right = fixRight as number;
  }

  // ====================== Align =======================
  const alignStyle: React.CSSProperties = {};
  if (align) {
    alignStyle.textAlign = align;
  }

  // ====================== Render ======================
  let title: string;
  const ellipsisConfig: CellEllipsisType = ellipsis === true ? { showTitle: true } : ellipsis;
  if (ellipsisConfig && (ellipsisConfig.showTitle || rowType === 'header')) {
    if (typeof childNode === 'string' || typeof childNode === 'number') {
      title = childNode.toString();
    } else if (React.isValidElement(childNode) && typeof childNode.props.children === 'string') {
      title = childNode.props.children;
    }
  }

  const componentProps = {
    title,
    ...restCellProps,
    ...additionalProps,
    colSpan: mergedColSpan && mergedColSpan !== 1 ? mergedColSpan : null,
    rowSpan: mergedRowSpan && mergedRowSpan !== 1 ? mergedRowSpan : null,
    className: classNames(
      cellPrefixCls,
      className,
      {
        [`${cellPrefixCls}-fix-left`]: isFixLeft && supportSticky,
        [`${cellPrefixCls}-fix-left-first`]: firstFixLeft && supportSticky,
        [`${cellPrefixCls}-fix-left-last`]: lastFixLeft && supportSticky,
        [`${cellPrefixCls}-fix-right`]: isFixRight && supportSticky,
        [`${cellPrefixCls}-fix-right-first`]: firstFixRight && supportSticky,
        [`${cellPrefixCls}-fix-right-last`]: lastFixRight && supportSticky,
        [`${cellPrefixCls}-ellipsis`]: ellipsis,
        [`${cellPrefixCls}-with-append`]: appendNode,
        [`${cellPrefixCls}-fix-sticky`]: (isFixLeft || isFixRight) && isSticky && supportSticky,
      },
      additionalProps.className,
      cellClassName,
    ),
    style: { ...additionalProps.style, ...alignStyle, ...fixedStyle, ...cellStyle },
    ref: isRefComponent(Component) ? ref : null,
    columnIndex: columnIndex,
    columnKey: columnKey,
  };

  return (
    <Component {...componentProps}>
      {appendNode}
      {childNode}
    </Component>
  );
}

const RefCell = React.forwardRef<any, CellProps<any>>(Cell);
RefCell.displayName = 'Cell';

const comparePropList: (keyof CellProps<any>)[] = ['expanded', 'className'];

const MemoCell = React.memo(RefCell, (prev: CellProps<any>, next: CellProps<any>) => {
  if (next.shouldCellUpdate) {
    return (
      // Additional handle of expanded logic
      comparePropList.every(propName => prev[propName] === next[propName]) &&
      // User control update logic
      !next.shouldCellUpdate(next.record, prev.record)
    );
  }

  return false;
});

export default MemoCell;
