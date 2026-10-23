
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehiculos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      codigo: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      conductor: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      capacidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      estado: {
        type: Sequelize.ENUM(
          'DISPONIBLE',
          'EN_RUTA',
          'MANTENIMIENTO',
        ),
        allowNull: false,
        defaultValue: 'DISPONIBLE',
      },
      latitud_actual: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      longitud_actual: {
        type: Sequelize.DOUBLE,
        allowNull: true,
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
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vehiculos');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_vehiculos_estado";',
    );
  },
};
