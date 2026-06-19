// Shadow Protocol: Red Cell - RPG State & Barracks Manager

const PROGRESS_SQUAD_KEY = 'shadowProtocolSquad';

const defaultSquad = [
    {
        id: 'op1',
        name: 'ДИНГ ЧАВЕЗ',
        classId: 'assault',
        className: 'ШТУРМОВИК',
        level: 1,
        xp: 0,
        unallocatedPoints: 0,
        portrait: 'chavez_portrait.jpg',
        stats: { hp: 100, maxHp: 100, armor: 30, ap: 10, aim: 80, willpower: 70, reflexes: 85 },
        selectedPerks: [], // list of unlocked perk IDs
        weapon: 'MP-10 SD',
        attachments: { scope: 'stock', muzzle: 'none', magazine: 'standard' }
    },
    {
        id: 'op2',
        name: 'ХУЛИО ВЕГА',
        classId: 'breacher',
        className: 'ПОДРЫВНИК',
        level: 1,
        xp: 0,
        unallocatedPoints: 0,
        portrait: 'vega_portrait.jpg',
        stats: { hp: 120, maxHp: 120, armor: 40, ap: 8, aim: 70, willpower: 85, reflexes: 50 },
        selectedPerks: [],
        weapon: 'MG-60',
        attachments: { scope: 'stock', muzzle: 'none', magazine: 'standard' }
    },
    {
        id: 'op3',
        name: 'АЛЕКС ДЖОНСТОН',
        classId: 'sniper',
        className: 'СНАЙПЕР',
        level: 1,
        xp: 0,
        unallocatedPoints: 0,
        portrait: 'johnston_portrait.jpg',
        stats: { hp: 90, maxHp: 90, armor: 15, ap: 6, aim: 90, willpower: 75, reflexes: 70 },
        selectedPerks: [],
        weapon: 'REMINGTON MAGNUM',
        attachments: { scope: 'stock', muzzle: 'none', magazine: 'standard' }
    }
];

const squadState = {
    operators: [],

    init: function() {
        const stored = localStorage.getItem(PROGRESS_SQUAD_KEY);
        if (stored) {
            try {
                this.operators = JSON.parse(stored);
                // Ensure backward compatibility of stats structures
                this.operators.forEach(op => {
                    const defOp = defaultSquad.find(d => d.id === op.id);
                    if (defOp) {
                        if (!op.stats) op.stats = { ...defOp.stats };
                        if (!op.attachments) op.attachments = { ...defOp.attachments };
                        if (!op.selectedPerks) op.selectedPerks = [];
                    }
                });
            } catch (e) {
                console.error("Failed to load squad state, resetting...", e);
                this.operators = JSON.parse(JSON.stringify(defaultSquad));
            }
        } else {
            this.operators = JSON.parse(JSON.stringify(defaultSquad));
        }
        this.save();
    },

    save: function() {
        localStorage.setItem(PROGRESS_SQUAD_KEY, JSON.stringify(this.operators));
    },

    reset: function() {
        this.operators = JSON.parse(JSON.stringify(defaultSquad));
        this.save();
    },

    addXp: function(opId, amount) {
        const op = this.operators.find(o => o.id === opId);
        if (!op) return;

        op.xp += amount;
        const tree = CLASS_TREES[op.classId];
        let leveledUp = false;
        
        while (true) {
            const nextLevelData = tree.levels.find(l => l.level === op.level + 1);
            if (nextLevelData && op.xp >= nextLevelData.xpNeeded) {
                op.level++;
                op.unallocatedPoints += 2; // 2 points to configure per level up
                
                // Boost stats as well naturally
                op.stats.maxHp += 5;
                op.stats.hp = op.stats.maxHp;
                op.stats.aim += 2;
                op.stats.willpower += 3;
                
                leveledUp = true;
            } else {
                break;
            }
        }
        this.save();
        return { leveledUp: leveledUp, level: op.level };
    },

    getModifiedStats: function(op) {
        // Deep copy stats
        let finalStats = JSON.parse(JSON.stringify(op.stats));
        
        // Add attachment effects
        const wpnData = WEAPONS[op.weapon];
        if (op.attachments) {
            // Scope
            const scope = ATTACHMENTS.scopes.find(s => s.id === op.attachments.scope);
            if (scope) {
                if (scope.acc) finalStats.aim += scope.acc;
            }
            
            // Muzzle
            const muzzle = ATTACHMENTS.muzzles.find(m => m.id === op.attachments.muzzle);
            if (muzzle) {
                if (muzzle.acc) finalStats.aim += muzzle.acc;
            }

            // Magazine
            const magazine = ATTACHMENTS.magazines.find(m => m.id === op.attachments.magazine);
            if (magazine) {
                if (magazine.pen) {
                    // Pen is a weapon property, handled in combat
                }
            }
        }

        // Perk effects
        if (op.selectedPerks.includes('heavy_shield')) {
            // handeled dynamically in cover formula
        }
        if (op.selectedPerks.includes('evasion')) {
            finalStats.reflexes += 15;
        }

        return finalStats;
    },

    selectPerk: function(opId, perkId, level) {
        const op = this.operators.find(o => o.id === opId);
        if (!op) return false;

        const tree = CLASS_TREES[op.classId];
        const lvlData = tree.levels.find(l => l.level === level);
        if (!lvlData || !lvlData.perks) return false;

        const perk = lvlData.perks.find(p => p.id === perkId);
        if (!perk) return false;

        // Check if op level is high enough
        if (op.level < level) return false;

        // Strip any existing perks at this tier/level to enforce mutually-exclusive choice
        const siblingPerkIds = lvlData.perks.map(p => p.id);
        op.selectedPerks = op.selectedPerks.filter(id => !siblingPerkIds.includes(id));
        
        // Add new perk
        op.selectedPerks.push(perkId);
        this.save();
        return true;
    },

    setAttachment: function(opId, slot, attachmentId) {
        const op = this.operators.find(o => o.id === opId);
        if (!op) return false;

        if (!op.attachments) op.attachments = { scope: 'stock', muzzle: 'none', magazine: 'standard' };
        op.attachments[slot] = attachmentId;
        this.save();
        return true;
    },

    upgradeStat: function(opId, statName) {
        const op = this.operators.find(o => o.id === opId);
        if (!op || op.unallocatedPoints <= 0) return false;

        if (statName === 'aim') {
            op.stats.aim += 3;
        } else if (statName === 'willpower') {
            op.stats.willpower += 5;
        } else if (statName === 'reflexes') {
            op.stats.reflexes += 4;
        } else if (statName === 'defense') {
            op.stats.armor += 5;
        } else if (statName === 'hp') {
            op.stats.maxHp += 10;
            op.stats.hp = op.stats.maxHp;
        } else {
            return false;
        }

        op.unallocatedPoints--;
        this.save();
        return true;
    }
};
