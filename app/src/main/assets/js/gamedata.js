// Shadow Protocol: Red Cell - Static Game Configuration & RPG Trees

const WEAPONS = {
    'MP-10 SD': { 
        name: 'MP-10 SD', 
        damage: 35, 
        pen: 15, 
        acc: 85, 
        silenced: true, 
        suppression: 5, 
        range: 7, 
        icon: '🔫',
        desc: 'Пистолет-пулемет с интегрированным глушителем. Идеален для бесшумных операций.' 
    },
    'MG-60': { 
        name: 'MG-60', 
        damage: 50, 
        pen: 25, 
        acc: 65, 
        silenced: false, 
        suppression: 45, 
        range: 10, 
        icon: '💥', 
        desc: 'Тяжелый пулемет. Оказывает колоссальное подавление на противника в секторе обстрела.'
    },
    'REMINGTON MAGNUM': { 
        name: 'Remington Magnum', 
        damage: 90, 
        pen: 60, 
        acc: 95, 
        silenced: false, 
        suppression: 10, 
        range: 15, 
        icon: '🎯',
        desc: 'Высокоточная снайперская винтовка. Огромная убойная сила и пробитие.'
    },
    'АКМС': { 
        name: 'АКМС-Кастом', 
        damage: 46, 
        pen: 22, 
        acc: 75, 
        silenced: false, 
        suppression: 20, 
        range: 9, 
        icon: '⚔️',
        desc: 'Модифицированный укороченный автомат. Сбалансированный выбор для штурма.' 
    },
    'УЗИ': { 
        name: 'УЗИ', 
        damage: 25, 
        pen: 5, 
        acc: 80, 
        silenced: false, 
        suppression: 15, 
        range: 6, 
        icon: '💨',
        desc: 'Компактный ПП боевиков. Высокий темп стрельбы на сверхкоротких дистанциях.'
    },
    'ДРОБОВИК': { 
        name: 'SPAS-12', 
        damage: 70, 
        pen: 5, 
        acc: 85, 
        silenced: false, 
        suppression: 25, 
        range: 4, 
        icon: '🛑',
        desc: 'Тактический дробовик. Разрушителен на дистанции до 4 метров, бесполезен дальше.'
    }
};

const ATTACHMENTS = {
    scopes: [
        { id: 'stock', name: 'Стандартный целик', acc: 0, desc: 'Заводские прицельные приспособления.' },
        { id: 'collimator', name: 'Коллиматор HoloSight', acc: 10, desc: 'Ускоряет прицеливание. +10 к точности.' },
        { id: 'scope2x', name: 'Оптика x2 Advanced', acc: 15, range: 1, desc: '+15 к точности, +1 к дальности поражения.' }
    ],
    muzzles: [
        { id: 'none', name: 'Стандартный ствол', damage: 0, silenced: false, desc: 'Пламегаситель отсутствует.' },
        { id: 'silencer', name: 'Тактический глушитель', damage: -5, silenced: true, desc: 'Скрывает выстрелы, но снижает урон на 5.' },
        { id: 'compensator', name: 'Дульный компенсатор', acc: 5, desc: 'Снижает отдачу при длинных очередях. +5 к точности.' }
    ],
    magazines: [
        { id: 'standard', name: 'Стандартный магазин', desc: 'Заводская емкость патронов.' },
        { id: 'heavy_ammo', name: 'Бронебойные патроны', pen: 15, damage: 5, desc: '+15 к пробитию брони, +5 к чистому урону.' }
    ]
};

const CLASS_TREES = {
    assault: {
        name: 'Штурмовик (Assault/CQB)',
        stats: { hp: 100, armor: 30, ap: 10, aim: 80, willpower: 70, reflexes: 85 },
        levels: [
            { level: 1, xpNeeded: 0, title: 'РЕКРУТ', bonus: 'Доступ к классовому оружию и базовому комплекту.' },
            { 
                level: 2, 
                xpNeeded: 100, 
                title: 'МЛАДШИЙ ОПЕРАТИВНИК', 
                perks: [
                    { id: 'adrenaline', name: 'Адреналиновый прилив', desc: 'Устранение цели возвращает 2 ОД (один раз за раунд).', isSelected: false },
                    { id: 'point_blank', name: 'В упор (Point Blank)', desc: 'Критический шанс увеличивается на +40% на расстоянии до 3 клеток.', isSelected: false }
                ] 
            },
            { 
                level: 3, 
                xpNeeded: 250, 
                title: 'СПЕЦИАЛИСТ', 
                perks: [
                    { id: 'run_and_gun', name: 'Служба спасения', desc: 'Перемещение в укрытие стоимостью до 3 клеток не тратит ОД.', isSelected: false },
                    { id: 'grit', name: 'Твердость духа', desc: 'Полный иммунитет к эффекту подавления и панике.', isSelected: false }
                ] 
            },
            { 
                level: 4, 
                xpNeeded: 500, 
                title: 'ВЕТЕРАН', 
                perks: [
                    { id: 'evasion', name: 'Уклонение', desc: 'Шанс врага попасть по вам снижен на 20% всегда.', isSelected: false },
                    { id: 'double_tap_assault', name: 'Штурмовой натиск', desc: 'После точного попадания выстрел из пистолета-пулемета стоит на 1 ОД меньше.', isSelected: false }
                ] 
            },
            {
                level: 5,
                xpNeeded: 1000,
                title: 'ТИХИЙ ЖНЕЦ (ELITE)',
                perks: [
                    { id: 'shadow_step', name: 'Теневой шаг', desc: 'Перемещение не активирует огонь наблюдения (Overwatch) противников.', isSelected: false }
                ]
            }
        ]
    },
    breacher: {
        name: 'Инженер-Подрывник (Breacher)',
        stats: { hp: 120, armor: 45, ap: 8, aim: 70, willpower: 85, reflexes: 50 },
        levels: [
            { level: 1, xpNeeded: 0, title: 'РЕКРУТ', bonus: 'Доступ к тяжелому вооружению и взрывчатке.' },
            { 
                level: 2, 
                xpNeeded: 100, 
                title: 'ТЕХНИК-СЕРЖАНТ', 
                perks: [
                    { id: 'explosive_entry', name: 'Ударная волна', desc: 'Взрыв дверей пробивающим зарядом наносит 30 ед. урона врагам в радиусе 2 клеток.', isSelected: false },
                    { id: 'suppression_master', name: 'Мастер Подавления', desc: 'Выстрелы подавляют цели на 40% сильнее, уменьшая их ОД на следующем ходу.', isSelected: false }
                ] 
            },
            { 
                level: 3, 
                xpNeeded: 250, 
                title: 'ИНЖЕНЕР СМЕРТИ', 
                perks: [
                    { id: 'heavy_shield', name: 'Тяжелый щит', desc: 'Снижает весь входящий урон на 25%, если боец находится в полуукрытии или за преградой.', isSelected: false },
                    { id: 'bulletproof', name: 'Осколочный жилет', desc: 'Игрок полностью невосприимчив к взрывной волне собственных зарядов.', isSelected: false }
                ] 
            },
            { 
                level: 4, 
                xpNeeded: 500, 
                title: 'ГЛАВНЫЙ ИНЖЕНЕР', 
                perks: [
                    { id: 'demolitionist', name: 'Эксперт C4', desc: 'Выдает +1 дополнительный пробивной снаряд на миссию.', isSelected: false },
                    { id: 'armor_repair', name: 'Замена пластин', desc: 'Использование аптечки также полностью восстанавливает броню.', isSelected: false }
                ] 
            },
            {
                level: 5,
                xpNeeded: 1000,
                title: 'РАЗРУШИТЕЛЬ (ELITE)',
                perks: [
                    { id: 'shredder', name: 'Осколочный шквал', desc: 'Каждая атака разрушает 10 ед. брони противника без снижения урона.', isSelected: false }
                ]
            }
        ]
    },
    sniper: {
        name: 'Снайпер-Ликвидатор (Sniper)',
        stats: { hp: 90, armor: 15, ap: 6, aim: 90, willpower: 75, reflexes: 70 },
        levels: [
            { level: 1, xpNeeded: 0, title: 'РЕКРУТ', bonus: 'Доступ к дальнобойному оружию и оптоэлектронике.' },
            { 
                level: 2, 
                xpNeeded: 100, 
                title: 'СТАРШИЙ НАВОДЧИК', 
                perks: [
                    { id: 'high_ground', name: 'Превосходство', desc: '+20 к меткости по врагам, находящимся на расстоянии более 8 клеток.', isSelected: false },
                    { id: 'quiet_killer', name: 'Тихая ликвидация', desc: 'Ликвидация врага бесшумным выстрелом не сбивает режим скрытности с отряда.', isSelected: false }
                ] 
            },
            { 
                level: 3, 
                xpNeeded: 250, 
                title: 'МАСТЕР ОГНЯ', 
                perks: [
                    { id: 'double_tap', name: 'Двойное касание', desc: 'Если снайпер не совершал движений в текущем ходу, выстрел требует на 3 ОД меньше.', isSelected: false },
                    { id: 'spy_network', name: 'Глубокое сканирование', desc: 'Радиус действия тактических сенсоров увеличен вдвое.', isSelected: false }
                ] 
            },
            { 
                level: 4, 
                xpNeeded: 500, 
                title: 'ПРИЗРАК ПОЛЯ БОЯ', 
                perks: [
                    { id: 'tactical_relocation', name: 'Смена позиции', desc: 'Раз в 3 раунда дает 2 бесплатных ОД строго на ходьбу после выстрела.', isSelected: false },
                    { id: 'headshot', name: 'Смертельный калибр', desc: 'Критический урон увеличивается на 50%.', isSelected: false }
                ] 
            },
            {
                level: 5,
                xpNeeded: 1000,
                title: 'СОЛЗБЕРИ (ELITE)',
                perks: [
                    { id: 'executioner', name: 'Каратель', desc: 'Гарантированное критическое попадание, если у цели менее 50% здоровья.', isSelected: false }
                ]
            }
        ]
    }
};

const OPERATOR_BACKGROUNDS = {
    assault: {
        bio: 'Доминго "Динг" Чавес. Родился в Лос-Анджелесе. Бывший член уличной банды, завербованный спецназом. Прошел огонь и воду во время секретных войн в Колумбии. Эксперт ближнего городского штурма.',
        quirks: { name: 'Адреналиновый наркоман', desc: 'Получает дополнительные ОД при совершении убийств, но быстрее впадает в ярость при потерях.' },
        specialty: 'Дозвуковой бесшумный огонь из засад и фланговые обходы.'
    },
    breacher: {
        bio: 'Хулио Вега. Происхождение: Мексиканская граница. Бывший капрал рейнджеров США. Рост 195 см. Обладает нечеловеческой физической выносливостью и маниакальной тягой к взрывчатым веществам.',
        quirks: { name: 'Каменный щит', desc: 'Игнорирует эффекты снижения точности при подавляющем огне противника.' },
        specialty: 'Снос тяжелых бетонных заграждений, удерживание коридоров.'
    },
    sniper: {
        bio: 'Алекс Джонстон. Родился в Глазго, Великобритания. Отставной чемпион королевских войск по высокоточной стрельбе. Холодный философ, считает пулю лучшим аргументом в международной дипломатии.',
        quirks: { name: 'Эстетика смерти', desc: '+20% к урону по боссам и лидерам группировок.' },
        specialty: 'Сверхдальний визуальный контроль территории и упреждающий огонь.'
    }
};
