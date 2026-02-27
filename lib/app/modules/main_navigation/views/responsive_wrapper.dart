import 'package:flutter/material.dart';

class ResponsiveWrapper extends StatelessWidget {
  final Widget child;
  final double maxWidth;

  const ResponsiveWrapper({
    super.key,
    required this.child,
    this.maxWidth = 768,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > maxWidth;

        return Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: isWide ? maxWidth : double.infinity,
            ),
            child: child,
          ),
        );
      },
    );
  }
}
