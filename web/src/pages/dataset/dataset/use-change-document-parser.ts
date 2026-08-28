import { useSetModalState } from '@/hooks/common-hooks';
import {
  useSetDocumentParser,
  useSetDocumentPipelineParser,
} from '@/hooks/use-document-request';
import { IDocumentInfo } from '@/interfaces/database/document';
import { IChangeParserRequestBody } from '@/interfaces/request/document';
import { pickByBackend } from '@/utils/backend-variant';
import { useCallback, useState } from 'react';

export const useChangeDocumentParser = () => {
  const { setDocumentParser, loading } = useSetDocumentParser();
  const { setDocumentPipelineParser, loading: pipelineParserLoading } =
    useSetDocumentPipelineParser();
  const [records, setRecords] = useState<IDocumentInfo[]>([]);
  const record = records[0] ?? ({} as IDocumentInfo);

  const {
    visible: changeParserVisible,
    hideModal: hideChangeParserModal,
    showModal: showChangeParserModal,
  } = useSetModalState();

  const onChangeParserOk = useCallback(
    async (parserConfigInfo: IChangeParserRequestBody) => {
      const documentIds = records.map((item) => item.id).filter(Boolean);
      if (documentIds.length > 0 && record?.dataset_id) {
        // The Go document endpoint takes `parser_id` and a pipeline-shaped
        // parser_config; the Python one keeps the legacy payload shape.
        const common = {
          parserId: parserConfigInfo.parser_id,
          pipelineId: parserConfigInfo.pipeline_id || '',
          documentIds,
          datasetId: record?.dataset_id,
          parserConfig: parserConfigInfo.parser_config,
        };
        const ret = await pickByBackend({
          go: () =>
            setDocumentPipelineParser({
              ...common,
              parseType: parserConfigInfo.parseType,
            }),
          python: () => setDocumentParser(common),
        })();
        if (ret === 0) {
          hideChangeParserModal();
        }
      }
    },
    [
      records,
      record?.dataset_id,
      setDocumentParser,
      setDocumentPipelineParser,
      hideChangeParserModal,
    ],
  );

  const handleShowChangeParserModal = useCallback(
    (rows: IDocumentInfo | IDocumentInfo[]) => {
      setRecords(Array.isArray(rows) ? rows : [rows]);
      showChangeParserModal();
    },
    [showChangeParserModal],
  );

  return {
    changeParserLoading: loading || pipelineParserLoading,
    onChangeParserOk,
    changeParserVisible,
    hideChangeParserModal,
    showChangeParserModal: handleShowChangeParserModal,
    changeParserRecord: record,
  };
};

export type UseChangeDocumentParserShowType = Pick<
  ReturnType<typeof useChangeDocumentParser>,
  'showChangeParserModal'
>;
