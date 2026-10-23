
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pedidos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      destinatario: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      direccion: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      latitud: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      longitud: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      prioridad: {
        type: Sequelize.ENUM('BAJA', 'MEDIA', 'ALTA'),
        allowNull: false,
        defaultValue: 'MEDIA',
      },
      estado: {
        type: Sequelize.ENUM(
          'PENDIENTE',
          'ASIGNADO',
          'EN_CAMINO',
          'ENTREGADO',
          'CANCELADO',
        ),
        allowNull: false,
        defaultValue: 'PENDIENTE',
      },
      observaciones: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('pedidos');
  },
};
