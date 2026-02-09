import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'dart:io';

part 'database.g.dart';

// Events Table
class Events extends Table {
  TextColumn get id => text()();
  TextColumn get name => text().withLength(min: 3, max: 100)();
  DateTimeColumn get date => dateTime()();
  TextColumn get location => text().nullable()();
  TextColumn get description => text().nullable()();
  TextColumn get status => text().withDefault(const Constant('active'))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get modifiedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

// Registrations Table
class Registrations extends Table {
  TextColumn get id => text()();
  TextColumn get eventId => text().references(Events, #id)();
  TextColumn get name => text().withLength(min: 2, max: 100)();
  TextColumn get organization => text().nullable()();
  TextColumn get email => text().nullable()();
  TextColumn get phone => text().nullable()();
  TextColumn get role => text()();
  BoolColumn get marketingConsent => boolean().withDefault(const Constant(false))();
  BoolColumn get photoConsent => boolean().withDefault(const Constant(false))();
  DateTimeColumn get checkinTime => dateTime().nullable()();
  DateTimeColumn get checkoutTime => dateTime().nullable()();
  TextColumn get syncStatus => text().withDefault(const Constant('pending'))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get modifiedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

// Sync Logs Table
class SyncLogs extends Table {
  TextColumn get id => text()();
  TextColumn get entityType => text()();
  TextColumn get entityId => text()();
  TextColumn get syncTarget => text()();
  TextColumn get status => text()();
  TextColumn get errorMessage => text().nullable()();
  DateTimeColumn get timestamp => dateTime()();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();

  @override
  Set<Column> get primaryKey => {id};
}

// Database class
@DriftDatabase(tables: [Events, Registrations, SyncLogs])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator m) async {
        await m.createAll();
        
        // Create indexes for better query performance
        await customStatement(
          'CREATE INDEX idx_events_status ON events(status);',
        );
        await customStatement(
          'CREATE INDEX idx_events_date ON events(date);',
        );
        await customStatement(
          'CREATE INDEX idx_registrations_event_id ON registrations(event_id);',
        );
        await customStatement(
          'CREATE INDEX idx_registrations_sync_status ON registrations(sync_status);',
        );
        await customStatement(
          'CREATE INDEX idx_registrations_email ON registrations(email);',
        );
        await customStatement(
          'CREATE INDEX idx_registrations_checkin ON registrations(checkin_time);',
        );
        await customStatement(
          'CREATE INDEX idx_sync_logs_entity ON sync_logs(entity_type, entity_id);',
        );
        await customStatement(
          'CREATE INDEX idx_sync_logs_status ON sync_logs(status);',
        );
        await customStatement(
          'CREATE INDEX idx_sync_logs_timestamp ON sync_logs(timestamp);',
        );
      },
      onUpgrade: (Migrator m, int from, int to) async {
        // Future migrations will go here
      },
    );
  }

  // Event queries
  Future<List<Event>> getAllEvents() => select(events).get();
  
  Future<Event?> getActiveEvent() {
    return (select(events)..where((e) => e.status.equals('active'))).getSingleOrNull();
  }

  Future<Event?> getEventById(String id) {
    return (select(events)..where((e) => e.id.equals(id))).getSingleOrNull();
  }

  Future<int> insertEvent(EventsCompanion event) {
    return into(events).insert(event);
  }

  Future<bool> updateEvent(Event event) {
    return update(events).replace(event);
  }

  // Registration queries
  Future<List<Registration>> getRegistrationsByEvent(String eventId) {
    return (select(registrations)..where((r) => r.eventId.equals(eventId))).get();
  }

  Future<List<Registration>> getCheckedInRegistrations(String eventId) {
    return (select(registrations)
          ..where((r) => r.eventId.equals(eventId) & r.checkinTime.isNotNull()))
        .get();
  }

  Future<int> getAttendanceCount(String eventId) async {
    final query = selectOnly(registrations)
      ..addColumns([registrations.id.count()])
      ..where(registrations.eventId.equals(eventId) & 
              registrations.checkinTime.isNotNull() &
              registrations.checkoutTime.isNull());
    
    final result = await query.getSingle();
    return result.read(registrations.id.count()) ?? 0;
  }

  Future<int> insertRegistration(RegistrationsCompanion registration) {
    return into(registrations).insert(registration);
  }

  Future<bool> updateRegistration(Registration registration) {
    return update(registrations).replace(registration);
  }

  Future<List<Registration>> getPendingSyncRegistrations() {
    return (select(registrations)..where((r) => r.syncStatus.equals('pending'))).get();
  }

  // Sync log queries
  Future<int> insertSyncLog(SyncLogsCompanion log) {
    return into(syncLogs).insert(log);
  }

  Future<List<SyncLog>> getSyncLogsByEntity(String entityType, String entityId) {
    return (select(syncLogs)
          ..where((l) => l.entityType.equals(entityType) & l.entityId.equals(entityId))
          ..orderBy([(l) => OrderingTerm.desc(l.timestamp)]))
        .get();
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'power2inspire_events.db'));
    return NativeDatabase(file);
  });
}

