const MISSIONS = [
    {
        id: 'mission1',
        title: 'ОПЕРАЦИЯ "МЁРТВАЯ ВОДА"',
        description: '<span style="color: #0aa; font-weight: bold;">ЛОКАЦИЯ:</span> Заброшенный портовый терминал, Восточная Европа.<br><span style="color: #0aa; font-weight: bold;">УГРОЗА:</span> Ячейка эко-террористов "ИРА" пытается вывезти контейнеры с химическим оружием VX.<br><span style="color: #0aa; font-weight: bold;">ЗАДАЧА:</span> Проникнуть на территорию терминала. Нейтрализовать боевиков. Обезопасить заложника (научный сотрудник Посол).<br><br><span style="color: #f55;">ПРЕДУПРЕЖДЕНИЕ: Враг хорошо вооружен. Рекомендуется использовать ПНВ и бесшумное устранение. Если заложник пострадает, миссия будет провалена.</span>',
        background: 'briefing_port.jpg',
        hvt: {
            id: 'TX-440-B',
            name: 'ГРЕДИ (ПОЗЫВНОЙ)',
            threat: '██████░░░░ (HIGH)',
            image: 'chavez_portrait.jpg' // using generic placeholder for boss
        },
        cutscene: [
            { bg: 'main_menu_bg.jpg', speaker: 'ЦЕНТР', text: 'Чавес, это Центр. Разведка подтвердила наличие химического оружия на территории порта.' },
            { bg: 'briefing_port.jpg', speaker: 'ЧАВЕС', text: 'Вижу объект. Охрана расставлена по периметру. Заложник внутри.' },
            { bg: 'briefing_port.jpg', speaker: 'ЦЕНТР', text: 'Действуй скрытно. Любой шум сорвет операцию.' }
        ],
        enemies: [
            { id: 'en1', type: 'enemy', name: 'ГРЭДИ (ИРА)', x: 15, y: 15, ap: 8, maxAp: 8, hp: 60, maxHp: 60, armor: 15, weapon: 'АКМС', alert: false, sightRadius: 7, hearingRadius: 6, color: 0xff0000 },
            { id: 'en2', type: 'enemy', name: 'МОДЕЛЬ', x: 16, y: 12, ap: 8, maxAp: 8, hp: 60, maxHp: 60, armor: 5, weapon: 'УЗИ', alert: false, sightRadius: 6, hearingRadius: 5, color: 0xff0000 },
            { id: 'en3', type: 'enemy', name: 'БОЕВИК', x: 13, y: 14, ap: 7, maxAp: 7, hp: 50, maxHp: 50, armor: 5, weapon: 'ДРОБОВИК', alert: false, sightRadius: 6, hearingRadius: 5, color: 0xff0000 }
        ],
        hostages: [
            { id: 'hst1', type: 'hostage', name: 'ПОСОЛ (ЗАЛОЖНИК)', x: 14, y: 15, ap: 0, maxAp: 0, hp: 30, maxHp: 30, armor: 0, color: 0xffaa00 }
        ]
    },
    {
        id: 'mission2',
        title: 'ОПЕРАЦИЯ "ПЕСЧАНАЯ БУРЯ"',
        description: '<span style="color: #0aa; font-weight: bold;">ЛОКАЦИЯ:</span> Заброшенный роскошный отель, Дубай.<br><span style="color: #0aa; font-weight: bold;">УГРОЗА:</span> Местный синдикат взял в плен западных журналистов.<br><span style="color: #0aa; font-weight: bold;">ЗАДАЧА:</span> Зачистить вестибюль. Спасти журналиста.<br><br><span style="color: #f55;">ВРАГИ ИМЕЮТ ПРЕИМУЩЕСТВО В БЛИЖНЕМ БОЮ.</span>',
        background: 'briefing_sandstorm.jpg',
        hvt: {
            id: 'AF-109-X',
            name: 'АЛЬ-ЖАРАД',
            threat: '████████░░ (CRITICAL)',
            image: 'vega_portrait.jpg' // using generic portrait
        },
        cutscene: [
            { bg: 'briefing_sandstorm.jpg', speaker: 'ВЕГА', text: 'Центр, я на позиции. Вестибюль под контролем боевиков.' },
            { bg: 'briefing_sandstorm.jpg', speaker: 'ЦЕНТР', text: 'Не позволь им уйти с журналистом. Применяй подавление.' }
        ],
        enemies: [
            { id: 'en1', type: 'enemy', name: 'НАЕМНИК', x: 8, y: 10, ap: 10, maxAp: 10, hp: 80, maxHp: 80, armor: 20, weapon: 'ДРОБОВИК', alert: false, sightRadius: 6, hearingRadius: 6, color: 0xff0000 },
            { id: 'en2', type: 'enemy', name: 'СНАЙПЕР', x: 18, y: 2, ap: 6, maxAp: 6, hp: 40, maxHp: 40, armor: 5, weapon: 'REMINGTON MAGNUM', alert: false, sightRadius: 10, hearingRadius: 4, color: 0xff0000 },
            { id: 'en3', type: 'enemy', name: 'ОХРАНА', x: 12, y: 14, ap: 8, maxAp: 8, hp: 60, maxHp: 60, armor: 10, weapon: 'УЗИ', alert: false, sightRadius: 6, hearingRadius: 5, color: 0xff0000 },
            { id: 'en4', type: 'enemy', name: 'ОХРАНА 2', x: 16, y: 16, ap: 8, maxAp: 8, hp: 60, maxHp: 60, armor: 10, weapon: 'УЗИ', alert: false, sightRadius: 6, hearingRadius: 5, color: 0xff0000 }
        ],
        hostages: [
            { id: 'hst1', type: 'hostage', name: 'ЖУРНАЛИСТ', x: 9, y: 10, ap: 0, maxAp: 0, hp: 30, maxHp: 30, armor: 0, color: 0xffaa00 }
        ]
    },
    {
        id: 'mission3',
        title: 'ОПЕРАЦИЯ "ЗОЛОТОЙ ДРАКОН"',
        description: '<span style="color: #0aa; font-weight: bold;">ЛОКАЦИЯ:</span> Небоскреб корпорации "Ксинкс", Нео-Шанхай.<br><span style="color: #0aa; font-weight: bold;">УГРОЗА:</span> Корпоративная СБ изымает серверы с разведданными Red Cell.<br><span style="color: #0aa; font-weight: bold;">ЗАДАЧА:</span> Полная ликвидация элитного спецназа корпорации. Контроль этажа.<br><br><span style="color: #f55;">ПРЕДУПРЕЖДЕНИЕ: Охрана использует тяжелую броню и автоматическое оружие. Внимательно планируйте ходы. Тщательно используйте гаджеты. Заложников нет.</span>',
        background: 'briefing_skyscraper.jpg',
        hvt: {
            id: 'KJ-992-O',
            name: 'КИНГ "ДЖАГГЕРНАУТ"',
            threat: '██████████+ (EXTREME)',
            image: 'johnston_portrait.jpg' // generic heavy
        },
        cutscene: [
            { bg: 'briefing_skyscraper.jpg', speaker: 'ЧАВЕС', text: 'Они уже здесь. Серверная окружена.' },
            { bg: 'briefing_skyscraper.jpg', speaker: 'ВЕГА', text: 'Вижу Джаггернаута. Крупный калибр. Будет жарко.' },
            { bg: 'briefing_skyscraper.jpg', speaker: 'ЦЕНТР', text: 'Уничтожить всех. Эти данные не должны попасть к корпоратам.' }
        ],
        enemies: [
            { id: 'en1', type: 'enemy', name: 'ЭЛИТНЫЙ БОЕЦ', x: 10, y: 5, ap: 10, maxAp: 10, hp: 100, maxHp: 100, armor: 30, weapon: 'АКМС', alert: false, sightRadius: 8, hearingRadius: 7, color: 0xff0000 },
            { id: 'en2', type: 'enemy', name: 'ЭЛИТНЫЙ БОЕЦ', x: 15, y: 5, ap: 10, maxAp: 10, hp: 100, maxHp: 100, armor: 30, weapon: 'АКМС', alert: false, sightRadius: 8, hearingRadius: 7, color: 0xff0000 },
            { id: 'en3', type: 'enemy', name: 'ДЖАГГЕРНАУТ', x: 12, y: 10, ap: 6, maxAp: 6, hp: 200, maxHp: 200, armor: 50, weapon: 'MG-60', alert: false, sightRadius: 6, hearingRadius: 6, color: 0xff0000 },
            { id: 'en4', type: 'enemy', name: 'СНАЙПЕР', x: 5, y: 18, ap: 8, maxAp: 8, hp: 60, maxHp: 60, armor: 10, weapon: 'REMINGTON MAGNUM', alert: false, sightRadius: 12, hearingRadius: 5, color: 0xff0000 },
            { id: 'en5', type: 'enemy', name: 'ОПЕРАТОР ДРОНА', x: 18, y: 15, ap: 8, maxAp: 8, hp: 70, maxHp: 70, armor: 15, weapon: 'УЗИ', alert: false, sightRadius: 7, hearingRadius: 6, color: 0xff0000 }
        ],
        hostages: []
    }
];
