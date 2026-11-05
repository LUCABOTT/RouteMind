'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'ubicaciones_recorrido',
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
          latitud: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          longitud: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          precision_m: {
            type: Sequelize.DOUBLE,
            allowNull: true,
          },
          registrado_en: {
            type: Sequelize.DATE,
            allowNull: false,
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
        'ubicaciones_recorrido',
        ['recorrido_id', 'registrado_en'],
        { transaction },
      );
      await queryInterface.addColumn(
        'paradas_recorrido',
        'latitud',
        { type: Sequelize.DOUBLE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'paradas_recorrido',
        'longitud',
        { type: Sequelize.DOUBLE, allowNull: true },
        { transaction },
      );
      await queryInterface.changeColumn(
        'paradas_recorrido',
        'pedido_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'pedidos',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'recorridos',
        'tiempo_movimiento_segundos',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(
        'recorridos',
        'tiempo_movimiento_segundos',
        { transaction },
      );
      await queryInterface.sequelize.query(
        'DELETE FROM "paradas_recorrido" WHERE "pedido_id" IS NULL',
        { transaction },
      );
      await queryInterface.changeColumn(
        'paradas_recorrido',
        'pedido_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'pedidos',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        { transaction },
      );
      await queryInterface.removeColumn('paradas_recorrido', 'longitud', {
        transaction,
      });
      await queryInterface.removeColumn('paradas_recorrido', 'latitud', {
        transaction,
      });
      await queryInterface.dropTable('ubicaciones_recorrido', {
        transaction,
      });
    });
  },
};
