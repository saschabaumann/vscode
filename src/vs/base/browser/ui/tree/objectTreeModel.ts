/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { ISpliceable } from 'vs/base/common/sequence';
import { Iterator, ISequence } from 'vs/base/common/iterator';
import { IndexTreeModel, IIndexTreeModelOptions } from 'vs/base/browser/ui/tree/indexTreeModel';
import { Event } from 'vs/base/common/event';
import { ITreeModel, ITreeNode, ITreeElement } from 'vs/base/browser/ui/tree/tree';

export interface IObjectTreeModelOptions<T, TFilterData> extends IIndexTreeModelOptions<T, TFilterData> { }

export class ObjectTreeModel<T extends NonNullable<any>, TFilterData = void> implements ITreeModel<T, TFilterData, ITreeNode<T, TFilterData>> {

	private model: IndexTreeModel<T, TFilterData>;
	private nodes = new Map<T, ITreeNode<T, TFilterData>>();

	readonly onDidChangeCollapseState: Event<ITreeNode<T, TFilterData>>;

	get size(): number { return this.nodes.size; }

	constructor(list: ISpliceable<ITreeNode<T, TFilterData>>, options: IObjectTreeModelOptions<T, TFilterData> = {}) {
		this.model = new IndexTreeModel(list, options);
		this.onDidChangeCollapseState = this.model.onDidChangeCollapseState;
	}

	setChildren(element: T | null, children?: ISequence<ITreeElement<T>>): Iterator<ITreeElement<T>> {
		const location = this.getElementLocation(element);
		const insertedElements = new Set<T>();

		const onDidCreateNode = (node: ITreeNode<T, TFilterData>) => {
			insertedElements.add(node.element);
			this.nodes.set(node.element, node);
		};

		const onDidDeleteNode = (node: ITreeNode<T, TFilterData>) => {
			if (!insertedElements.has(node.element)) {
				this.nodes.delete(node.element);
			}
		};

		return this.model.splice([...location, 0], Number.MAX_VALUE, children, onDidCreateNode, onDidDeleteNode);
	}

	getListIndex(node: ITreeNode<T, TFilterData>): number {
		const location = this.getElementLocation(node.element);
		return this.model.getListIndex(location);
	}

	setCollapsed(node: ITreeNode<T, TFilterData>, collapsed: boolean): boolean {
		const location = this.getElementLocation(node.element);
		return this.model.setCollapsed(location, collapsed);
	}

	toggleCollapsed(node: ITreeNode<T, TFilterData>): void {
		const location = this.getElementLocation(node.element);
		this.model.toggleCollapsed(location);
	}

	isCollapsed(node: ITreeNode<T, TFilterData>): boolean {
		const location = this.getElementLocation(node.element);
		return this.model.isCollapsed(location);
	}

	refilter(): void {
		this.model.refilter();
	}

	private getElementLocation(element: T | null): number[] {
		if (element === null) {
			return [];
		}

		const node = this.nodes.get(element);

		if (!node) {
			throw new Error(`Tree element not found: ${element}`);
		}

		return this.model.getNodeLocation(node);
	}

	getNodeLocation(node: ITreeNode<T, TFilterData>): ITreeNode<T, TFilterData> {
		return node;
	}

	getParentNodeLocation(node: ITreeNode<T, TFilterData>): ITreeNode<T, TFilterData> | null {
		return node.parent || null;
	}
}