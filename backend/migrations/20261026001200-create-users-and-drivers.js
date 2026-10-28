'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'users',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          email: {
            type: Sequelize.STRING(254),
            allowNull: false,
            unique: true,
          },
          name: {
            type: Sequelize.STRING(120),
            allowNull: false,
          },
          password_hash: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          role: {
            type: Sequelize.ENUM(
              'SUPERADMIN',
              'ADMIN',
              'PLANIFICADOR',
              'VIEWER',
            ),
            allowNull: false,
            defaultValue: 'PLANIFICADOR',
          },
          active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'conductores',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          nombre: {
            type: Sequelize.STRING(100),
            allowNull: false,
          },
          telefono: {
            type: Sequelize.STRING(30),
            allowNull: true,
            unique: true,
          },
          licencia: {
            type: Sequelize.STRING(50),
            allowNull: true,
            unique: true,
          },
          activo: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `INSERT INTO conductores (nombre, activo, created_at, updated_at)
         SELECT DISTINCT conductor, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         FROM vehiculos
         WHERE conductor IS NOT NULL AND btrim(conductor) <> ''
         ON CONFLICT DO NOTHING`,
        { transaction },
      );

      await queryInterface.addColumn(
        'vehiculos',
        'conductor_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'conductores',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE vehiculos
         SET conductor_id = conductores.id
         FROM conductores
         WHERE vehiculos.conductor = conductores.nombre`,
        { transaction },
      );

      await queryInterface.removeColumn('vehiculos', 'conductor', {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'vehiculos',
        'conductor',
        {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE vehiculos
         SET conductor = conductores.nombre
         FROM conductores
         WHERE vehiculos.conductor_id = conductores.id`,
        { transaction },
      );

      await queryInterface.removeColumn('vehiculos', 'conductor_id', {
        transaction,
      });
      await queryInterface.dropTable('conductores', { transaction });
      await queryInterface.dropTable('users', { transaction });
    });

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_role";',
    );
  },
};
