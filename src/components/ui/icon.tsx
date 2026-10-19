import { SymbolView, type SFSymbol } from 'expo-symbols';
import type { ComponentProps } from 'react';

import type { CategoryIcon } from '@/domain/entities';

type AndroidSymbol = Extract<
	ComponentProps<typeof SymbolView>['name'],
	{ android?: unknown }
>['android'];

const ICONS = {
	home: ['house.fill', 'home'],
	activity: ['list.bullet.rectangle', 'receipt_long'],
	planning: ['chart.pie.fill', 'pie_chart'],
	calendar: ['calendar', 'calendar_month'],
	settings: ['gearshape.fill', 'settings'],
	add: ['plus', 'add'],
	card: ['creditcard.fill', 'credit_card'],
	category: ['square.grid.2x2.fill', 'category'],
	visible: ['eye', 'visibility'],
	hidden: ['eye.slash', 'visibility_off'],
	lock: ['lock.fill', 'lock'],
	biometric: ['faceid', 'fingerprint'],
	delete: ['trash', 'delete'],
	edit: ['pencil', 'edit'],
	repeat: ['repeat', 'repeat'],
	camera: ['camera.fill', 'photo_camera'],
	photo: ['photo', 'image'],
	search: ['magnifyingglass', 'search'],
	chevronRight: ['chevron.right', 'chevron_right'],
	chevronLeft: ['chevron.left', 'chevron_left'],
	chevronUpDown: ['chevron.up.chevron.down', 'arrow_drop_down'],
	check: ['checkmark', 'check'],
	close: ['xmark', 'close'],
	warning: ['exclamationmark.triangle.fill', 'warning'],
	export: ['square.and.arrow.up', 'upload'],
	import: ['square.and.arrow.down', 'download'],
	shield: ['checkmark.shield.fill', 'shield'],
	info: ['info.circle', 'info'],
	notifications: ['bell.fill', 'notifications'],
	person: ['person.crop.circle', 'person'],
	income: ['arrow.down.left', 'trending_up'],
	expense: ['arrow.up.right', 'trending_down'],
	schedule: ['clock', 'schedule'],
	filter: ['line.3.horizontal.decrease.circle', 'filter_list'],
	sort: ['arrow.up.arrow.down', 'swap_vert'],
	today: ['calendar.circle', 'today'],
	attachment: ['paperclip', 'attach_file'],
	backup: ['externaldrive.fill', 'backup'],
	restore: ['clock.arrow.circlepath', 'restore'],
	currency: ['dollarsign.circle', 'currency_exchange'],
	wallet: ['wallet.pass.fill', 'account_balance_wallet'],
	account: ['building.columns.fill', 'account_balance'],
	transfer: ['arrow.left.arrow.right', 'swap_horiz'],
	goal: ['flag.checkered', 'flag'],
	spark: ['sparkles', 'auto_awesome'],
	recurring: ['calendar.badge.clock', 'event_repeat'],
	database: ['cylinder.split.1x2', 'database'],
	tag: ['tag.fill', 'sell'],
	food: ['fork.knife', 'restaurant'],
	transport: ['car.fill', 'directions_car'],
	shopping: ['bag.fill', 'shopping_bag'],
	housing: ['house.fill', 'house'],
	utilities: ['bolt.fill', 'bolt'],
	entertainment: ['film.fill', 'movie'],
	fitness: ['figure.run', 'fitness_center'],
	health: ['cross.case.fill', 'medical_services'],
	education: ['graduationcap.fill', 'school'],
	travel: ['airplane', 'flight'],
	pets: ['pawprint.fill', 'pets'],
	gifts: ['gift.fill', 'redeem'],
	savings: ['banknote.fill', 'savings'],
} as const satisfies Record<string, readonly [string, string]>;

export type IconName = keyof typeof ICONS | CategoryIcon;

const CATEGORY_TO_ICON: Record<CategoryIcon, keyof typeof ICONS> = {
	tag: 'tag',
	food: 'food',
	transport: 'transport',
	shopping: 'shopping',
	income: 'savings',
	housing: 'housing',
	utilities: 'utilities',
	entertainment: 'entertainment',
	fitness: 'fitness',
	health: 'health',
	education: 'education',
	travel: 'travel',
	pets: 'pets',
	gifts: 'gifts',
};

export interface IconProps {
	name: IconName;
	size?: number;
	color: string;
}

export function Icon({ name, size = 20, color }: IconProps) {
	const key = (
		name in CATEGORY_TO_ICON ? CATEGORY_TO_ICON[name as CategoryIcon] : name
	) as keyof typeof ICONS;
	const [ios, android] = ICONS[key];
	return (
		<SymbolView
			name={{ ios: ios as SFSymbol, android: android as AndroidSymbol }}
			size={size}
			tintColor={color}
			weight='medium'
			accessible={false}
			importantForAccessibility='no'
		/>
	);
}
