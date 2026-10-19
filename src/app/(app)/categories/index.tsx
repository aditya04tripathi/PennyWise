import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CategoryBadge } from '@/components/finance/category-badge';
import { showMessage, userFacingError } from '@/components/feedback/confirm';
import { ErrorState, LoadingState } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Divider, Section, Surface } from '@/components/ui/surface';
import { Sheet } from '@/components/ui/sheet';
import { AppText } from '@/components/ui/text';
import type { Category } from '@/domain/entities';
import {
	archiveCategory,
	categoryUsage,
	deleteCategory,
} from '@/features/catalog/catalog-service';
import { useCategories } from '@/hooks/use-app-data';
import { useTheme } from '@/theme/use-theme';

type Removal = { category: Category; usage: number; reassignTo: string | null };

export default function CategoriesScreen() {
	const theme = useTheme();
	const query = useCategories(true);
	const [removal, setRemoval] = useState<Removal | null>(null);
	const [busy, setBusy] = useState(false);
	const active = query.categories.filter((category) => !category.archivedAt);
	const archived = query.categories.filter((category) => category.archivedAt);

	const startRemoval = async (category: Category) => {
		try {
			setRemoval({
				category,
				usage: await categoryUsage(category.id),
				reassignTo: null,
			});
		} catch (error) {
			showMessage(
				'Could not check this category',
				userFacingError(error),
			);
		}
	};

	const run = async (action: () => Promise<void>) => {
		setBusy(true);
		try {
			await action();
			setRemoval(null);
		} catch (error) {
			showMessage('Not changed', userFacingError(error));
		} finally {
			setBusy(false);
		}
	};

	const renderRow = (category: Category, index: number) => (
		<View key={category.id}>
			{index > 0 ? <Divider inset={64} /> : null}
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					gap: theme.spacing.sm,
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.xs,
				}}>
				<CategoryBadge category={category} />
				<Pressable
					style={{
						flex: 1,
						minHeight: theme.layout.minTouchTarget,
						justifyContent: 'center',
					}}
					accessibilityRole='button'
					accessibilityLabel={`Edit ${category.name}`}
					onPress={() =>
						router.push({
							pathname: '/categories/edit',
							params: { id: category.id },
						})
					}>
					<AppText variant='body' style={{ fontWeight: '500' }}>
						{category.name}
					</AppText>
				</Pressable>
				{category.archivedAt ? (
					<Button
						label='Restore'
						variant='ghost'
						compact
						onPress={() =>
							run(() => archiveCategory(category.id, false))
						}
					/>
				) : (
					<Pressable
						accessibilityRole='button'
						accessibilityLabel={`Remove ${category.name}`}
						onPress={() => startRemoval(category)}
						style={{
							minWidth: theme.layout.minTouchTarget,
							minHeight: theme.layout.minTouchTarget,
							alignItems: 'center',
							justifyContent: 'center',
						}}>
						<Icon
							name='delete'
							size={18}
							color={theme.colors.textTertiary}
						/>
					</Pressable>
				)}
			</View>
		</View>
	);

	const targets = active.filter(
		(category) => category.id !== removal?.category.id,
	);

	return (
		<>
			<Stack.Screen
				options={{
					headerRight: () => (
						<Button
							label='Add'
							variant='ghost'
							compact
							onPress={() => router.push('/categories/edit')}
						/>
					),
				}}
			/>
			<Screen>
				{query.status === 'loading' ? <LoadingState /> : null}
				{query.status === 'error' ? (
					<ErrorState
						message='Categories could not be loaded.'
						onRetry={query.reload}
					/>
				) : null}
				<Surface padded={false}>{active.map(renderRow)}</Surface>
				{archived.length > 0 ? (
					<Section title='Archived'>
						<Surface padded={false}>
							{archived.map(renderRow)}
						</Surface>
						<AppText variant='bodySmall' tone='textSecondary'>
							Archived categories keep their history but can no
							longer be chosen for new transactions.
						</AppText>
					</Section>
				) : null}
			</Screen>

			<Sheet
				visible={removal !== null}
				title={removal ? `Remove ${removal.category.name}` : ''}
				onClose={() => setRemoval(null)}>
				{removal && removal.usage === 0 ? (
					<>
						<AppText variant='body'>
							No transactions use this category. It will be
							deleted.
						</AppText>
						<Button
							label='Delete category'
							variant='destructive'
							loading={busy}
							fullWidth
							onPress={() =>
								run(() =>
									deleteCategory(removal.category.id, null),
								)
							}
						/>
					</>
				) : null}
				{removal && removal.usage > 0 ? (
					<>
						<AppText variant='body'>
							{removal.usage}{' '}
							{removal.usage === 1
								? 'transaction uses'
								: 'transactions use'}{' '}
							this category. Archive it to keep history as it is,
							or move those transactions to another category and
							delete it.
						</AppText>
						<Button
							label='Archive category'
							variant='secondary'
							loading={busy}
							fullWidth
							onPress={() =>
								run(() =>
									archiveCategory(removal.category.id, true),
								)
							}
						/>
						{targets.length > 0 ? (
							<Section title='Or move transactions to'>
								<View
									style={{
										flexDirection: 'row',
										flexWrap: 'wrap',
										gap: theme.spacing.xs,
									}}>
									{targets.map((category) => (
										<Chip
											key={category.id}
											label={category.name}
											selected={
												removal.reassignTo ===
												category.id
											}
											onPress={() =>
												setRemoval({
													...removal,
													reassignTo: category.id,
												})
											}
											leading={
												<CategoryBadge
													category={category}
													size={20}
												/>
											}
										/>
									))}
								</View>
								<Button
									label='Move and delete'
									variant='destructive'
									disabled={!removal.reassignTo}
									loading={busy}
									fullWidth
									onPress={() =>
										run(() =>
											deleteCategory(
												removal.category.id,
												removal.reassignTo,
											),
										)
									}
								/>
							</Section>
						) : null}
					</>
				) : null}
			</Sheet>
		</>
	);
}
