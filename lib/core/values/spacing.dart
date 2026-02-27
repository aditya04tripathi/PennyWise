import 'package:flutter/material.dart';

class AppSpacing {
  static const double xs = 4.0;
  static const double s = 8.0;
  static const double m = 16.0;
  static const double l = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;
  static const double xxxl = 64.0;

  // Standard Paddings
  static const EdgeInsets pXS = EdgeInsets.all(xs);
  static const EdgeInsets pS = EdgeInsets.all(s);
  static const EdgeInsets pM = EdgeInsets.all(m);
  static const EdgeInsets pL = EdgeInsets.all(l);
  static const EdgeInsets pXL = EdgeInsets.all(xl);

  // Vertical Spacing
  static const SizedBox vXS = SizedBox(height: xs);
  static const SizedBox vS = SizedBox(height: s);
  static const SizedBox vM = SizedBox(height: m);
  static const SizedBox vL = SizedBox(height: l);
  static const SizedBox vXL = SizedBox(height: xl);

  // Horizontal Spacing
  static const SizedBox hXS = SizedBox(width: xs);
  static const SizedBox hS = SizedBox(width: s);
  static const SizedBox hM = SizedBox(width: m);
  static const SizedBox hL = SizedBox(width: l);
  static const SizedBox hXL = SizedBox(width: xl);
}
