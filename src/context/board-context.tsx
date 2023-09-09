"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  experimental_useOptimistic as useOptimistic,
} from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { BoardDetail, ListDetail } from "@/types/board";
import {
  updateCard,
  updateCardPositions,
} from "@/app/(dashboard)/[username]/[boardSlug]/actions";

interface BoardContextProps {
  board: BoardDetail;
  lists: ListDetail[];
  path: string;
}

const BoardContext = createContext<BoardContextProps>({} as BoardContextProps);

export function useBoardContext() {
  return useContext(BoardContext) as BoardContextProps;
}

interface BoardContextProviderProps extends PropsWithChildren {
  board: BoardDetail;
  lists: ListDetail[];
}

const BoardContextProvider: FC<BoardContextProviderProps> = ({
  children,
  board,
  lists: initialLists,
}) => {
  const path = `/${board.owner.name}/${board.slug}`;
  const [lists, handleDragEnd] = useOptimistic(
    initialLists,
    (state, { destination, source, draggableId }: DropResult) => {
      if (!destination) return state;

      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return state;
      }

      const sourceList = state.find((x) => x.id === source.droppableId);
      const destList = state.find((x) => x.id === destination.droppableId);
      if (!sourceList || !destList) return state;

      const item = sourceList.cards.find((x) => x.id == draggableId);
      if (!item) return state;

      sourceList.cards.splice(source.index, 1);
      destList.cards.splice(destination.index, 0, item);

      updateCardPositions(
        sourceList.cards.map((x, i) => ({ id: x.id, position: i + 1 }))
      );

      if (sourceList.id !== destList.id) {
        updateCard(item.id, { listId: destList.id });
        updateCardPositions(
          destList.cards.map((x, i) => ({ id: x.id, position: i + 1 }))
        );
      }

      return state;
    }
  );

  return (
    <BoardContext.Provider value={{ board, lists, path }}>
      <DragDropContext onDragEnd={handleDragEnd}>{children}</DragDropContext>
    </BoardContext.Provider>
  );
};

export default BoardContextProvider;
