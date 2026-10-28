'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'CONDUCTOR'`,
    );

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'users',
        'conductor_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          unique: true,
          references: {
            model: 'conductores',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'vehiculos',
        'gps_updated_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'vehiculos',
        'gps_accuracy_m',
        {
          type: Sequelize.DOUBLE,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'paradas_recorrido',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          recorrido_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'recorridos',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          pedido_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'pedidos',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          llegada_en: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          salida_en: {
            type: Sequelize.DATE,
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
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'paradas_recorrido',
        ['recorrido_id', 'pedido_id', 'llegada_en'],
        { transaction },
      );
      await queryInterface.addIndex(
        'paradas_recorrido',
        ['recorrido_id', 'salida_en'],
        { transaction },
      );
      await queryInterface.addIndex(
        'paradas_recorrido',
        ['recorrido_id'],
        {
          unique: true,
          where: { salida_en: null },
          name: 'paradas_recorrido_una_abierta_por_recorrido',
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('paradas_recorrido', { transaction });
      await queryInterface.removeColumn('vehiculos', 'gps_updated_at', {
        transaction,
      });
      await queryInterface.removeColumn('vehiculos', 'gps_accuracy_m', {
        transaction,
      });
      await queryInterface.removeColumn('users', 'conductor_id', {
        transaction,
      });
    });
  },
};
