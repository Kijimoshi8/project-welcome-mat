import { queryOptions } from '@tanstack/react-query';
import { getBdlData } from './bdl.functions';

export const bdlQueryOptions = queryOptions({
  queryKey: ['gus-bdl'],
  queryFn: () => getBdlData(),
  staleTime: 60 * 60 * 1000,
});