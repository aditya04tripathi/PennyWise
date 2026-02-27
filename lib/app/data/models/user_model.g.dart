// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class UserAdapter extends TypeAdapter<User> {
  @override
  final int typeId = 0;

  @override
  User read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return User(
      name: fields[0] as String,
      primaryCurrency: fields[1] as String,
      pin: fields[2] as String?,
      isBiometricEnabled: fields[3] as bool,
      isOnboardingCompleted: fields[4] as bool,
      monthlyBudget: fields[5] as double?,
      budgetAlertLimitPercent: fields[6] as double,
      budgetAlertsEnabled: fields[7] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, User obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.name)
      ..writeByte(1)
      ..write(obj.primaryCurrency)
      ..writeByte(2)
      ..write(obj.pin)
      ..writeByte(3)
      ..write(obj.isBiometricEnabled)
      ..writeByte(4)
      ..write(obj.isOnboardingCompleted)
      ..writeByte(5)
      ..write(obj.monthlyBudget)
      ..writeByte(6)
      ..write(obj.budgetAlertLimitPercent)
      ..writeByte(7)
      ..write(obj.budgetAlertsEnabled);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
