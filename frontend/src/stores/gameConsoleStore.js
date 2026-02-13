import { create } from "zustand";
import { persist } from "zustand/middleware";

const createEmptyPlayer = () => ({
  playerName: "",
  characterName: "",
  xinfa: "",
  personalCards: [],
  notes: "",
});

const createEmptyTeam = () => ({
  gold: 0,
  cards: [],
  notes: "",
  players: Array.from({ length: 5 }, createEmptyPlayer),
});

const useGameConsoleStore = create(
  persist(
    (set, get) => ({
      qqGroupNumber: "",
      currentBoss: 1,
      teams: Array.from({ length: 5 }, createEmptyTeam),
      discardPile: [],
      logs: [],

      setQQGroupNumber: (num) => set({ qqGroupNumber: num }),

      setCurrentBoss: (boss) => set({ currentBoss: boss }),

      updatePlayer: (teamIdx, playerIdx, data) =>
        set((state) => {
          const teams = structuredClone(state.teams);
          teams[teamIdx].players[playerIdx] = {
            ...teams[teamIdx].players[playerIdx],
            ...data,
          };
          return { teams };
        }),

      swapPlayers: (fromTeam, fromPlayer, toTeam, toPlayer) =>
        set((state) => {
          const teams = structuredClone(state.teams);
          const temp = teams[fromTeam].players[fromPlayer];
          teams[fromTeam].players[fromPlayer] = teams[toTeam].players[toPlayer];
          teams[toTeam].players[toPlayer] = temp;
          return { teams };
        }),

      adjustTeamGold: (teamIdx, amount) =>
        set((state) => {
          const teams = structuredClone(state.teams);
          teams[teamIdx].gold += amount;
          return { teams };
        }),

      assignCardToTeam: (teamIdx, card) =>
        set((state) => {
          const teams = structuredClone(state.teams);
          teams[teamIdx].cards.push(card);
          return { teams };
        }),

      removeCardFromTeam: (teamIdx, cardIndex) =>
        set((state) => {
          const teams = structuredClone(state.teams);
          teams[teamIdx].cards.splice(cardIndex, 1);
          return { teams };
        }),

      assignCardToPlayer: (teamIdx, playerIdx, card) =>
        set((state) => {
          const teams = structuredClone(state.teams);
          teams[teamIdx].players[playerIdx].personalCards.push(card);
          return { teams };
        }),

      removeCardFromPlayer: (teamIdx, playerIdx, cardIndex) =>
        set((state) => {
          const teams = structuredClone(state.teams);
          teams[teamIdx].players[playerIdx].personalCards.splice(cardIndex, 1);
          return { teams };
        }),

      updateTeamNotes: (teamIdx, notes) =>
        set((state) => {
          const teams = structuredClone(state.teams);
          teams[teamIdx].notes = notes;
          return { teams };
        }),

      addToDiscardPile: (card) =>
        set((state) => ({
          discardPile: [...state.discardPile, card],
        })),

      removeFromDiscardPile: (index) =>
        set((state) => {
          const discardPile = [...state.discardPile];
          discardPile.splice(index, 1);
          return { discardPile };
        }),

      addLog: (type, message) =>
        set((state) => ({
          logs: [
            {
              id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
              timestamp: new Date().toLocaleString("zh-CN"),
              type,
              message,
            },
            ...state.logs,
          ],
        })),

      exportState: () => {
        const { qqGroupNumber, currentBoss, teams, discardPile, logs } = get();
        return JSON.stringify({ qqGroupNumber, currentBoss, teams, discardPile, logs }, null, 2);
      },

      importState: (jsonStr) => {
        try {
          const data = JSON.parse(jsonStr);
          set({
            qqGroupNumber: data.qqGroupNumber ?? "",
            currentBoss: data.currentBoss ?? 1,
            teams: data.teams ?? Array.from({ length: 5 }, createEmptyTeam),
            discardPile: data.discardPile ?? [],
            logs: data.logs ?? [],
          });
          return true;
        } catch {
          return false;
        }
      },

      resetAll: () =>
        set({
          qqGroupNumber: "",
          currentBoss: 1,
          teams: Array.from({ length: 5 }, createEmptyTeam),
          discardPile: [],
          logs: [],
        }),
    }),
    {
      name: "game-console-storage",
    }
  )
);

export default useGameConsoleStore;
