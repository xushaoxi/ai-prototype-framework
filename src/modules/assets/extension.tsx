import { InfoCircleOutlined } from '@ant-design/icons';
import type { BusinessRecord } from '../../core/types';
export function AssetDetailExtra(record:BusinessRecord) {
  if(record.status!=='archived') return null;
  return <div className="detail-note"><InfoCircleOutlined/>已归档资产保留完整记录。如需重新登记，可恢复为草稿。</div>;
}
