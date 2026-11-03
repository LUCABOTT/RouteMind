
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pedidos', 'recorrido_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'recorridos',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('pedidos', 'recorrido_id');
  },
};
