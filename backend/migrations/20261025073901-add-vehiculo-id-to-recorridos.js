
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recorridos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      vehiculo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'vehiculos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      fecha_inicio: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      fecha_fin: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      distancia_total_km: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },

      total_pedidos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      estado: {
        type: Sequelize.ENUM('EN_CURSO', 'COMPLETADO'),
        allowNull: false,
        defaultValue: 'EN_CURSO',
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
    await queryInterface.dropTable('recorridos');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_recorridos_estado";',
    );
  },
};
