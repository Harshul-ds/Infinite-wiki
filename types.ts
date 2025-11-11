/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface PinnedItem {
  id: string;
  type: 'concept' | 'ascii';
  content: any;
  x: number;
  y: number;
}
